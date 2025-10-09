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

export async function getRecentNews(
  vertical?: string,
  ticker?: string,
  limit: number = 20,
  delayMinutes: number = 0
): Promise<ProcessedNewsItem[]> {
  let whereClause = '';
  let params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause based on vertical and ticker
  const conditions: string[] = [];

  if (vertical) {
    conditions.push(`category = $${paramIndex}`);
    params.push(vertical);
    paramIndex++;
  }

  if (ticker) {
    conditions.push(`ticker = $${paramIndex}`);
    params.push(ticker);
    paramIndex++;
  }

  // Add time-based filtering for tier delay
  if (delayMinutes > 0) {
    conditions.push(`published_at <= NOW() - INTERVAL '${delayMinutes} minutes'`);
  }

  whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  paramIndex = params.length;

  // Fetch more items than needed to ensure good diversity
  const fetchLimit = limit * 3;
  const fetchParams = [...params];
  fetchParams[fetchParams.length - 1] = fetchLimit;

  const rows = await query<ProcessedNewsItem>(
    `SELECT id, source, category as vertical, ticker, title, content, url, hash, published_at, fetched_at, delivered_at, metadata
     FROM news_items
     ${whereClause}
     ORDER BY published_at DESC
     LIMIT $${params.length}`,
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
