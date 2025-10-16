import Parser from 'rss-parser';
import { RSS_FEEDS, Vertical } from '../config/feeds.js';
import { NewsItem } from '../types/news.js';
import { generateHash, processNewsItem } from '../services/newsProcessor.js';
import { connectRedis, getCacheStats } from '../config/redis.js';
import * as dotenv from 'dotenv';

dotenv.config();

const parser = new Parser();

interface FeedConfig {
  name: string;
  url: string;
}

async function fetchRSSFeed(feedConfig: FeedConfig, vertical: Vertical): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items: NewsItem[] = feed.items.slice(0, 5).map((item) => {
      // Try multiple content fields in order of preference
      const content =
        item.contentSnippet ||
        item.summary ||
        item.description ||
        item.content ||
        item['content:encoded'] ||
        (item as any).excerpt ||
        '';

      // Debug logging for stocks to see what fields are available
      if (vertical === 'stocks' && !content) {
        console.log(`⚠️ [${feedConfig.name}] No content found. Available fields:`, Object.keys(item));
      }

      return {
        source: feedConfig.name,
        vertical,
        title: item.title || 'Untitled',
        content,
        url: item.link || '',
        publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
        hash: generateHash(item.title || '', item.link || ''),
      };
    });

    const itemsWithContent = items.filter(i => i.content).length;
    console.log(`📰 Fetched ${items.length} items from ${feedConfig.name} (${vertical}) - ${itemsWithContent} with content`);
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
    console.log(`📊 Total items fetched: ${allNews.length}`);

    // Process news items directly (no queue needed)
    let processed = 0;
    let duplicates = 0;

    for (const item of allNews) {
      const success = await processNewsItem(item);
      if (success) {
        processed++;
      } else {
        duplicates++;
      }
    }

    const cacheStats = getCacheStats();
    console.log(`✅ Processed: ${processed} new, ${duplicates} duplicates`);
    console.log(`💾 Cache stats: ${cacheStats.size}/${cacheStats.maxSize} entries`);
    console.log(`🎯 Cache performance: ${cacheStats.hitRate} hit rate (${cacheStats.cacheHits} hits, ${cacheStats.cacheMisses} misses)`);
    console.log(`📉 Redis queries: ${cacheStats.redisQueries} (saved ${cacheStats.redisSaved} queries via cache)\n`);
  } catch (error) {
    console.error('❌ Error in poll cycle:', error);
  }
}

