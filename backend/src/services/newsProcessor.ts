import crypto from 'crypto';
import { NewsItem, ProcessedNewsItem } from '../types/news.js';
import { query } from '../config/database.js';
import { checkDuplicate, markAsProcessed } from '../config/redis.js';

export function generateHash(title: string, url: string): string {
  return crypto.createHash('sha256').update(title + url).digest('hex');
}

export async function processNewsItem(item: NewsItem): Promise<boolean> {
  try {
    // Check for duplicates in Redis
    const isDuplicate = await checkDuplicate(item.hash);
    if (isDuplicate) {
      console.log(`⏭️  Duplicate skipped: ${item.title.substring(0, 50)}...`);
      return false;
    }

    // Store in database
    await query(
      `INSERT INTO news_items (source, category, ticker, title, content, url, hash, published_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (hash) DO NOTHING`,
      [
        item.source,
        item.vertical,
        item.ticker || null,
        item.title,
        item.content,
        item.url,
        item.hash,
        item.publishedAt,
        JSON.stringify({}),
      ]
    );

    // Mark as processed in Redis
    await markAsProcessed(item.hash);

    console.log(`✅ Processed: [${item.vertical}] ${item.title.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error('Error processing news item:', error);
    return false;
  }
}

export async function getRecentNews(vertical?: string, ticker?: string, limit: number = 20): Promise<ProcessedNewsItem[]> {
  let whereClause = '';
  let params: any[] = [];
  let paramIndex = 1;

  if (vertical && ticker) {
    whereClause = 'WHERE category = $1 AND ticker = $2';
    params = [vertical, ticker, limit];
    paramIndex = 3;
  } else if (vertical) {
    whereClause = 'WHERE category = $1';
    params = [vertical, limit];
    paramIndex = 2;
  } else if (ticker) {
    whereClause = 'WHERE ticker = $1';
    params = [ticker, limit];
    paramIndex = 2;
  } else {
    params = [limit];
    paramIndex = 1;
  }

  // Fetch more items than needed to ensure good diversity
  const fetchLimit = limit * 3;
  const fetchParams = [...params];
  fetchParams[fetchParams.length - 1] = fetchLimit;

  const rows = await query<ProcessedNewsItem>(
    `SELECT id, source, category as vertical, ticker, title, content, url, hash, published_at, fetched_at, delivered_at, metadata
     FROM news_items
     ${whereClause}
     ORDER BY published_at DESC
     LIMIT $${paramIndex}`,
    fetchParams
  );

  // Shuffle the results to show diverse sources
  const shuffled = shuffleArray(rows);

  // Return only the requested limit
  return shuffled.slice(0, limit);
}

// Fisher-Yates shuffle algorithm for randomizing array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
