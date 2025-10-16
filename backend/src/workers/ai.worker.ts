/**
 * AI Worker - On-Demand Processing for News Analysis
 * Processes ONLY user-requested articles via "Generate AI Analysis" button clicks
 * No automatic background processing - conserves tokens and prevents waste
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
  ai_analysis_requested?: boolean;
}

/**
 * Fetch on-demand requested articles that haven't been processed yet
 * Priority: User-requested articles get processed first
 */
async function fetchRequestedArticles(): Promise<UnprocessedNewsItem[]> {
  try {
    const rows = await query<UnprocessedNewsItem>(
      `SELECT id, category, ticker, title, content, url, ai_analysis_requested
       FROM news_items
       WHERE ai_analysis_requested = true
         AND ai_processed = false
         AND published_at > NOW() - INTERVAL '24 hours'
       ORDER BY fetched_at DESC
       LIMIT 10`,
      []
    );

    if (rows.length > 0) {
      console.log(`📊 Found ${rows.length} user-requested articles for AI analysis`);
    }

    return rows;
  } catch (error) {
    console.error('❌ Error fetching requested articles:', error);
    return [];
  }
}

/**
 * Fetch top 4 unprocessed news items per category (crypto, stocks, sports)
 * Conservative approach: 4 × 3 = 12 articles per cycle (every 5 minutes)
 * Daily max: 12 × 12 cycles/hour × 24 hours = 3,456 articles
 * Priority: Most recent articles in each category
 */
async function fetchUnprocessedNewsByCategory(): Promise<UnprocessedNewsItem[]> {
  try {
    const categories = ['crypto', 'stocks', 'sports'];
    const allItems: UnprocessedNewsItem[] = [];

    // Fetch top 4 articles per category in parallel
    const categoryPromises = categories.map(async (cat) => {
      const rows = await query<UnprocessedNewsItem>(
        `SELECT id, category, ticker, title, content, url, published_at
         FROM news_items
         WHERE ai_processed = false
           AND (ai_analysis_requested = false OR ai_analysis_requested IS NULL)
           AND category = $1
           AND published_at > NOW() - INTERVAL '24 hours'
         ORDER BY published_at DESC
         LIMIT 4`,
        [cat]
      );
      return rows;
    });

    const results = await Promise.all(categoryPromises);
    results.forEach((rows) => allItems.push(...rows));

    console.log(
      `📊 Fetched ${allItems.length} background articles: ${results[0].length} crypto, ${results[1].length} stocks, ${results[2].length} sports`
    );

    return allItems;
  } catch (error) {
    console.error('❌ Error fetching unprocessed news by category:', error);
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
 * Process a single article by ID (for on-demand requests)
 * @param articleId - ID of the article to process
 * @returns true if processing succeeded, false otherwise
 */
export async function processArticleById(articleId: number): Promise<boolean> {
  try {
    // Check if AI service is available
    if (!aiService.isAvailable()) {
      console.log('⏸️  AI service not available');
      return false;
    }

    // Fetch the specific article
    const rows = await query<UnprocessedNewsItem>(
      `SELECT id, category, ticker, title, content, url
       FROM news_items
       WHERE id = $1 AND ai_processed = false`,
      [articleId]
    );

    if (rows.length === 0) {
      console.log(`⚠️  Article ${articleId} not found or already processed`);
      return false;
    }

    const item = rows[0];
    console.log(`🎯 Processing on-demand request for article ${articleId}: ${item.title.substring(0, 50)}...`);

    // Mark as requested
    await query(
      `UPDATE news_items SET ai_analysis_requested = true WHERE id = $1`,
      [articleId]
    );

    // Process the article
    const success = await processNewsWithAI(item);

    if (success) {
      console.log(`✅ On-demand analysis complete for article ${articleId}`);
    } else {
      console.log(`❌ On-demand analysis failed for article ${articleId}`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error processing article ${articleId}:`, error);
    return false;
  }
}

/**
 * Main processing cycle - On-Demand Only Approach
 * Processes ONLY user-requested articles (button clicks)
 * No automatic background processing to conserve tokens
 */
async function processAIBatch() {
  try {
    // Check if AI service is available
    if (!aiService.isAvailable()) {
      console.log('⏸️  AI service not available - skipping AI processing cycle');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process ONLY user-requested articles
    const requestedItems = await fetchRequestedArticles();

    if (requestedItems.length === 0) {
      // No articles to process (this is normal - only process when users request)
      return;
    }

    console.log(`🎯 Processing ${requestedItems.length} user-requested articles...`);

    for (const item of requestedItems) {
      const success = await processNewsWithAI(item);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Respectful delay between API calls (500ms = 2 req/sec)
      await new Promise((resolve) => setTimeout(resolve, 500));
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

  console.log(`🚀 AI Worker running - ON-DEMAND ONLY mode`);
  console.log(`📊 Processing only user-requested articles (button clicks)`);
  console.log(`🔑 Using model: ${status.model}`);
  console.log(`📊 Daily quota: ${status.quota.used}/${status.quota.limit} (${status.quota.percentage}%) | ${status.quota.remaining} remaining`);

  // Check every 30 seconds for user-requested articles
  // This is frequent enough to feel responsive while being efficient
  setInterval(async () => {
    await processAIBatch();
  }, 30000); // 30 seconds
}
