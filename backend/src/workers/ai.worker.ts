/**
 * AI Worker - Background Processing for News Analysis
 * Processes news items immediately after RSS fetch for zero perceived latency
 */

import { query } from '../config/database.js';
import { aiService } from '../services/aiService.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface UnprocessedNewsItem {
  id: number;
  category: string;
  ticker?: string;
  title: string;
  content?: string;
  url: string;
}

/**
 * Fetch unprocessed news items from database
 */
async function fetchUnprocessedNews(limit: number = 10): Promise<UnprocessedNewsItem[]> {
  try {
    const rows = await query<UnprocessedNewsItem>(
      `SELECT id, category, ticker, title, content, url
       FROM news_items
       WHERE ai_processed = false
       ORDER BY published_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  } catch (error) {
    console.error('❌ Error fetching unprocessed news:', error);
    return [];
  }
}

/**
 * Process a single news item with AI analysis
 */
async function processNewsWithAI(item: UnprocessedNewsItem): Promise<boolean> {
  try {
    // Call AI service for analysis
    const analysis = await aiService.analyzeNews({
      category: item.category as 'crypto' | 'stocks' | 'sports',
      ticker: item.ticker,
      title: item.title,
      content: item.content,
      url: item.url,
    });

    if (!analysis) {
      console.log(`⚠️  AI analysis failed for: ${item.title.substring(0, 50)}...`);
      return false;
    }

    // Store AI analysis in database
    await query(
      `UPDATE news_items
       SET ai_processed = true,
           ai_sentiment = $1,
           ai_price_impact = $2,
           ai_summary = $3,
           ai_processed_at = NOW()
       WHERE id = $4`,
      [
        JSON.stringify(analysis.sentiment),
        JSON.stringify(analysis.price_impact),
        JSON.stringify(analysis.summary),
        item.id,
      ]
    );

    console.log(
      `🤖 AI processed [${item.category}]: ${item.title.substring(0, 50)}... | Sentiment: ${analysis.sentiment.label} (${(analysis.sentiment.confidence * 100).toFixed(0)}%) | Impact: ${analysis.price_impact.level}`
    );

    return true;
  } catch (error) {
    console.error(`❌ Error processing news item ${item.id} with AI:`, error);
    return false;
  }
}

/**
 * Main processing cycle
 */
async function processAIBatch() {
  try {
    // Check if AI service is available
    if (!aiService.isAvailable()) {
      console.log('⏸️  AI service not available - skipping AI processing cycle');
      return;
    }

    // Fetch unprocessed news items (10 at a time to respect rate limits)
    const unprocessedItems = await fetchUnprocessedNews(10);

    if (unprocessedItems.length === 0) {
      console.log('✅ No unprocessed news items found');
      return;
    }

    console.log(`🔄 Processing ${unprocessedItems.length} news items with AI...`);

    let successCount = 0;
    let failureCount = 0;

    // Process items sequentially to respect rate limits
    // OpenRouter free tier likely has rate limits - 5-10 req/sec is safe
    for (const item of unprocessedItems) {
      const success = await processNewsWithAI(item);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Respectful delay between API calls (200ms = 5 req/sec)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const totalProcessed = successCount + failureCount;
    const successRate = totalProcessed > 0 ? Math.round((successCount / totalProcessed) * 100) : 0;
    console.log(`✅ AI batch complete: ${successCount}/${totalProcessed} success (${successRate}%), ${failureCount} failures\n`);
  } catch (error) {
    console.error('❌ Error in AI processing cycle:', error);
  }
}

/**
 * Start the AI worker
 */
export async function startAIWorker() {
  console.log('🤖 Starting AI Worker...');

  // Check if AI service is configured
  const status = aiService.getStatus();
  console.log(`📊 AI Service Status:`, status);

  if (!status.available) {
    console.warn(
      '⚠️  AI Worker disabled - OPENROUTER_API_KEY not configured. Set the environment variable to enable AI features.'
    );
    return;
  }

  console.log(`🚀 AI Worker running - processing news every 30 seconds`);
  console.log(`🔑 Using model: ${status.model}`);

  // Immediate first run
  await processAIBatch();

  // Then process every 30 seconds
  // This ensures most articles are processed before users click them
  setInterval(async () => {
    await processAIBatch();
  }, 30000);
}
