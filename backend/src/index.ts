import express from 'express';
import * as dotenv from 'dotenv';
import { pool } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { getRecentNews } from './services/newsProcessor.js';
import { fetchTickerNews } from './workers/ticker.worker.js';
import { getUserTier, getDeliveryDelay } from './services/whopTierService.js';
import { startRSSWorker } from './workers/rss.worker.js';
import { startAIWorker, processArticleById } from './workers/ai.worker.js';
import { query } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: 'database connection failed' });
  }
});

// Get recent news (for frontend)
app.get('/api/news', async (req, res) => {
  try {
    const { vertical, limit, userId } = req.query;

    // Determine delay based on user tier
    let delayMinutes = 15; // Default to free tier (15-minute delay)
    if (userId) {
      const delay = await getDeliveryDelay(userId as string);
      delayMinutes = delay / (60 * 1000); // Convert ms to minutes
    }

    const news = await getRecentNews(
      vertical as string | undefined,
      undefined,
      limit ? parseInt(limit as string) : 20,
      delayMinutes
    );
    res.json({ news, count: news.length });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get news by vertical
app.get('/api/news/:vertical', async (req, res) => {
  try {
    const { vertical } = req.params;
    const { limit, ticker, userId } = req.query;

    if (!['crypto', 'stocks', 'sports'].includes(vertical)) {
      return res.status(400).json({ error: 'Invalid vertical' });
    }

    // If ticker is provided, fetch fresh news from Yahoo Finance first
    if (ticker && vertical === 'stocks') {
      await fetchTickerNews(ticker as string);
    }

    // Determine delay based on user tier
    let delayMinutes = 15; // Default to free tier (15-minute delay)
    if (userId) {
      const delay = await getDeliveryDelay(userId as string);
      delayMinutes = delay / (60 * 1000); // Convert ms to minutes
      console.log(`📊 [${vertical}] User ${userId}: ${delayMinutes === 0 ? 'PREMIUM' : 'FREE'} tier → ${delayMinutes}min delay`);
    } else {
      console.log(`⚠️ [${vertical}] No userId provided, defaulting to 15min delay`);
    }

    const news = await getRecentNews(
      vertical,
      ticker as string | undefined,
      limit ? parseInt(limit as string) : 20,
      delayMinutes
    );
    res.json({ news, count: news.length });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Check user tier (for testing and frontend)
app.get('/api/tier/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const tier = await getUserTier(userId);
    const delay = await getDeliveryDelay(userId);

    res.json({
      userId,
      tier,
      isPremium: tier === 'premium',
      deliveryDelay: delay,
      deliveryDelayMinutes: delay / (60 * 1000),
    });
  } catch (error) {
    console.error('Error checking tier:', error);
    res.status(500).json({ error: 'Failed to check tier' });
  }
});

// Get AI analysis for a news item (Pro tier only)
app.get('/api/news/:id/ai', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    // Check user tier (Pro tier only)
    if (userId) {
      const tier = await getUserTier(userId as string);
      if (tier !== 'pro') {
        return res.status(403).json({ error: 'Pro tier required for AI features' });
      }
    }

    // Fetch AI analysis from database
    interface AINewsItem {
      ai_processed: boolean;
      ai_sentiment: any;
      ai_price_impact: any;
      ai_summary: any;
      ai_processed_at: Date | null;
    }

    const rows = await query<AINewsItem>(
      `SELECT ai_processed, ai_sentiment, ai_price_impact, ai_summary, ai_processed_at
       FROM news_items
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    const newsItem = rows[0];

    if (!newsItem.ai_processed) {
      return res.status(202).json({
        status: 'processing',
        message: 'AI analysis in progress',
      });
    }

    res.json({
      status: 'complete',
      sentiment: newsItem.ai_sentiment,
      price_impact: newsItem.ai_price_impact,
      summary: newsItem.ai_summary,
      processed_at: newsItem.ai_processed_at,
    });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch AI analysis' });
  }
});

// Request AI analysis for a news item (on-demand)
app.post('/api/news/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists
    interface NewsItem {
      id: number;
      title: string;
      ai_processed: boolean;
    }

    const rows = await query<NewsItem>(
      `SELECT id, title, ai_processed FROM news_items WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    const article = rows[0];

    // If already processed, return existing analysis
    if (article.ai_processed) {
      return res.json({
        status: 'already_processed',
        message: 'AI analysis already exists for this article',
        articleId: id,
      });
    }

    // Trigger on-demand AI analysis (async)
    console.log(`📝 On-demand AI analysis requested for article ${id}: ${article.title.substring(0, 50)}...`);

    // Process in background
    processArticleById(parseInt(id as string)).catch((error) => {
      console.error(`❌ Background processing failed for article ${id}:`, error);
    });

    // Return immediate response
    res.json({
      status: 'processing',
      message: 'AI analysis started. Check back in a few seconds.',
      articleId: id,
    });
  } catch (error) {
    console.error('Error requesting AI analysis:', error);
    res.status(500).json({ error: 'Failed to request AI analysis' });
  }
});

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Connect to Redis
    await connectRedis();

    // Start API server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📰 News API: http://localhost:${PORT}/api/news`);
    });

    // Start workers
    console.log('\n🔧 Starting background workers...');
    await startRSSWorker();
    console.log('✅ RSS Worker started successfully');

    await startAIWorker();
    console.log('✅ AI Worker started successfully\n');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
