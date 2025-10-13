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

export interface AIAnalysis {
  sentiment?: {
    label: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  price_impact?: {
    level: 'critical' | 'high' | 'medium' | 'low';
    direction: 'up' | 'down' | 'uncertain';
    reasoning: string;
  };
  summary?: {
    tldr: string;
    key_points: string[];
    entities: string[];
  };
}

export interface ProcessedNewsItem extends NewsItem {
  id?: number;
  fetchedAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
  ai_processed?: boolean;
  ai_sentiment?: AIAnalysis['sentiment'];
  ai_price_impact?: AIAnalysis['price_impact'];
  ai_summary?: AIAnalysis['summary'];
  ai_processed_at?: Date;
}
