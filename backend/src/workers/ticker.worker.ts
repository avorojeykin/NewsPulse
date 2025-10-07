import Parser from 'rss-parser';
import { generateHash, processNewsItem } from '../services/newsProcessor.js';

const parser = new Parser();

// Multiple RSS sources for ticker-specific news
const TICKER_RSS_SOURCES = [
  {
    name: 'Yahoo Finance',
    template: 'https://finance.yahoo.com/rss/headline?s=',
  },
  {
    name: 'MarketWatch',
    template: 'https://www.marketwatch.com/rss/stock/',
  },
  {
    name: 'Seeking Alpha',
    template: 'https://seekingalpha.com/api/sa/combined/',
    suffix: '.xml',
  },
];

export interface TickerFeedRequest {
  ticker: string;
}

/**
 * Fetch news for a specific stock ticker from multiple RSS sources
 */
export async function fetchTickerNews(ticker: string): Promise<void> {
  const upperTicker = ticker.toUpperCase();
  console.log(`📊 Fetching ticker news from multiple sources: ${upperTicker}`);

  let totalProcessed = 0;

  // Fetch from all sources in parallel
  const fetchPromises = TICKER_RSS_SOURCES.map(async (source) => {
    try {
      const feedUrl = `${source.template}${upperTicker}${source.suffix || ''}`;
      const feed = await parser.parseURL(feedUrl);

      if (!feed.items || feed.items.length === 0) {
        console.log(`⚠️  No items from ${source.name} for ${upperTicker}`);
        return 0;
      }

      // Process up to 10 items per source
      const itemsToProcess = feed.items.slice(0, 10);
      let processedCount = 0;

      for (const item of itemsToProcess) {
        if (!item.title || !item.link) continue;

        const newsItem = {
          source: source.name,
          vertical: 'stocks' as const,
          ticker: upperTicker,
          title: item.title,
          content: item.contentSnippet || item.content || '',
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          hash: generateHash(item.title, item.link),
        };

        const processed = await processNewsItem(newsItem);
        if (processed) processedCount++;
      }

      console.log(`✅ ${source.name}: Processed ${processedCount} items for ${upperTicker}`);
      return processedCount;
    } catch (error) {
      console.error(`❌ Error fetching from ${source.name} for ${upperTicker}:`, error);
      return 0;
    }
  });

  const results = await Promise.all(fetchPromises);
  totalProcessed = results.reduce((sum, count) => sum + count, 0);

  console.log(`✅ Total processed ${totalProcessed} items for ${upperTicker} from all sources`);
}

/**
 * Process a ticker feed request from the queue
 */
export async function processTickerFeedRequest(data: TickerFeedRequest): Promise<void> {
  await fetchTickerNews(data.ticker);
}
