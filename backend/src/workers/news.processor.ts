import { Worker } from 'bullmq';
import { NewsItem } from '../types/news';
import { processNewsItem } from '../services/newsProcessor';
import { pool } from '../config/database';
import { connectRedis } from '../config/redis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisConnection = {
  host: process.env.REDIS_URL?.includes('localhost') ? 'localhost' : process.env.REDIS_URL?.split('@')[1]?.split(':')[0],
  port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
};

export async function startNewsProcessor() {
  console.log('🚀 Starting News Processor Worker...');

  // Connect to Redis
  await connectRedis();

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  const worker = new Worker(
    'news-processing',
    async (job) => {
      const newsItem: NewsItem = job.data;

      console.log(`🔄 Processing: [${newsItem.vertical}] ${newsItem.title.substring(0, 60)}...`);

      const processed = await processNewsItem(newsItem);

      if (processed) {
        // TODO: Send to Whop channels here
        // await sendToWhopChannel(newsItem);
        return { success: true, item: newsItem.title };
      }

      return { success: false, reason: 'duplicate' };
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  console.log('📡 News Processor Worker running - waiting for jobs...\n');
}

// Run if executed directly
if (require.main === module) {
  startNewsProcessor().catch(console.error);
}
