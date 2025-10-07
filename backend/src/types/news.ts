export interface NewsItem {
  source: string;
  vertical: 'crypto' | 'stocks' | 'sports';
  ticker?: string; // Stock ticker symbol (e.g., AAPL, TSLA) - only for stocks
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  hash: string;
}

export interface ProcessedNewsItem extends NewsItem {
  id?: number;
  fetchedAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
}
