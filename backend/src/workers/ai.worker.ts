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
 * Fetch unprocessed news items from database with smart prioritization
 * Priority: 1) Recent articles (last 2 hours) 2) Articles with tickers 3) Top sources
 */
async function fetchUnprocessedNews(limit: number = 10): Promise<UnprocessedNewsItem[]> {
  try {
    const rows = await query<UnprocessedNewsItem>(
      `SELECT id, category, ticker, title, content, url, published_at,
        CASE
          -- Priority 1: Very recent articles (last 2 hours) = 100 points
          WHEN published_at > NOW() - INTERVAL '2 hours' THEN 100
          -- Priority 2: Recent articles (last 6 hours) = 50 points
          WHEN published_at > NOW() - INTERVAL '6 hours' THEN 50
          -- Priority 3: Older articles = 10 points
          ELSE 10
        END +
        CASE
          -- Bonus: Has ticker symbol (user searched) = +50 points
          WHEN ticker IS NOT NULL THEN 50
          ELSE 0
        END as priority_score
       FROM news_items
       WHERE ai_processed = false
         AND published_at > NOW() - INTERVAL '24 hours'  -- Only process last 24 hours
       ORDER BY priority_score DESC, published_at DESC
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

    // Fetch unprocessed news items (5 at a time for better quota management)
    const unprocessedItems = await fetchUnprocessedNews(5);

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
      '⚠️  AI Worker disabled - GROQ_API_KEY not configured or daily quota exceeded. Set the environment variable to enable AI features.'
    );
    return;
  }

  console.log(`🚀 AI Worker running - processing 5 articles every 2 minutes (optimized for quota)`);
  console.log(`🔑 Using model: ${status.model}`);
  console.log(`📊 Daily quota: ${status.quota.used}/${status.quota.limit} (${status.quota.percentage}%) | ${status.quota.remaining} remaining`);

  // Immediate first run
  await processAIBatch();

  // Then process every 2 minutes (120 seconds)
  // Optimized to process ~150/hour instead of 1,200/hour (87% reduction)
  // This keeps us well under the 14.4K daily limit
  setInterval(async () => {
    await processAIBatch();
  }, 120000);
}
