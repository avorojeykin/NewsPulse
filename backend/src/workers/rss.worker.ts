import Parser from 'rss-parser';
import { Queue } from 'bullmq';
import { RSS_FEEDS, Vertical } from '../config/feeds.js';
import { NewsItem } from '../types/news.js';
import { generateHash } from '../services/newsProcessor.js';
import { connectRedis, redisConnection, getCacheStats } from '../config/redis.js';
import * as dotenv from 'dotenv';

dotenv.config();

const parser = new Parser();
const newsQueue = new Queue('news-processing', {
  connection: redisConnection,
});

interface FeedConfig {
  name: string;
  url: string;
}

async function fetchRSSFeed(feedConfig: FeedConfig, vertical: Vertical): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items: NewsItem[] = feed.items.slice(0, 5).map((item) => ({
      source: feedConfig.name,
      vertical,
      title: item.title || 'Untitled',
      content: item.contentSnippet || item.summary || item.content || '',
      url: item.link || '',
      publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
      hash: generateHash(item.title || '', item.link || ''),
    }));

    console.log(`📰 Fetched ${items.length} items from ${feedConfig.name} (${vertical})`);
    return items;
  } catch (error) {
    console.error(`❌ Error fetching ${feedConfig.name}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

async function fetchAllFeeds(vertical: Vertical): Promise<NewsItem[]> {
  const feeds = RSS_FEEDS[vertical];
  const results: NewsItem[] = [];

  for (const feed of feeds) {
    const items = await fetchRSSFeed(feed, vertical);
    results.push(...items);
    // Respectful delay between feeds
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

export async function startRSSWorker() {
  console.log('🚀 Starting RSS Worker...');

  // Connect to Redis first
  await connectRedis();

  // EMERGENCY: Increased to 5 minutes to reduce Redis usage
  console.log('📡 RSS Worker running - polling every 5 minutes');

  // Immediate first run
  await pollFeeds();

  // Then poll every 5 minutes (300 seconds)
  setInterval(async () => {
    await pollFeeds();
  }, 300000);
}

async function pollFeeds() {
  try {
    console.log('\n⏰ Starting RSS poll cycle...');

    const [cryptoNews, stocksNews, sportsNews] = await Promise.all([
      fetchAllFeeds('crypto'),
      fetchAllFeeds('stocks'),
      fetchAllFeeds('sports'),
    ]);

    const allNews = [...cryptoNews, ...stocksNews, ...sportsNews];
    const cacheStats = getCacheStats();
    console.log(`📊 Total items fetched: ${allNews.length}`);
    console.log(`💾 Cache stats: ${cacheStats.size}/${cacheStats.maxSize} entries`);

    // Add to processing queue with 15-minute delay for free tier
    // TEMPORARY: Delay removed for testing - re-enable for production
    for (const item of allNews) {
      await newsQueue.add(
        'process-news',
        item,
        {
          delay: 0, // TESTING: Was 15 * 60 * 1000 (15 minutes)
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }

    console.log(`✅ Queued ${allNews.length} items for processing (15-min delay)\n`);
  } catch (error) {
    console.error('❌ Error in poll cycle:', error);
  }
}

