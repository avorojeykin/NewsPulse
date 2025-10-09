import express from 'express';
import * as dotenv from 'dotenv';
import { pool } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { getRecentNews } from './services/newsProcessor.js';
import { fetchTickerNews } from './workers/ticker.worker.js';
import { getUserTier, getDeliveryDelay } from './services/whopTierService.js';
import { startRSSWorker } from './workers/rss.worker.js';
import { startNewsProcessor } from './workers/news.processor.js';

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
    const { vertical, limit } = req.query;
    const news = await getRecentNews(
      vertical as string | undefined,
      undefined,
      limit ? parseInt(limit as string) : 20
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
    const { limit, ticker } = req.query;

    if (!['crypto', 'stocks', 'sports'].includes(vertical)) {
      return res.status(400).json({ error: 'Invalid vertical' });
    }

    // If ticker is provided, fetch fresh news from Yahoo Finance first
    if (ticker && vertical === 'stocks') {
      await fetchTickerNews(ticker as string);
    }

    const news = await getRecentNews(
      vertical,
      ticker as string | undefined,
      limit ? parseInt(limit as string) : 20
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
    await Promise.all([
      startRSSWorker(),
      startNewsProcessor(),
    ]);
    console.log('✅ All workers started successfully\n');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
