-- Migration: Add AI analysis columns to news_items table
-- Date: 2025-10-10
-- Purpose: Support AI-powered sentiment analysis and impact indicators

-- Add AI analysis columns
ALTER TABLE news_items
ADD COLUMN ai_processed BOOLEAN DEFAULT false,
ADD COLUMN ai_summary JSONB,
ADD COLUMN ai_sentiment JSONB,
ADD COLUMN ai_price_impact JSONB,
ADD COLUMN ai_processed_at TIMESTAMP;

-- Add index for AI processing status
CREATE INDEX idx_news_ai_processed ON news_items(ai_processed);
CREATE INDEX idx_news_ai_processed_at ON news_items(ai_processed_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN news_items.ai_processed IS 'Whether AI analysis has been completed';
COMMENT ON COLUMN news_items.ai_summary IS 'AI-generated summary: {tldr: string, key_points: string[], entities: string[]}';
COMMENT ON COLUMN news_items.ai_sentiment IS 'Sentiment analysis: {label: "bullish"|"bearish"|"neutral", confidence: number, reasoning: string}';
COMMENT ON COLUMN news_items.ai_price_impact IS 'Price impact prediction: {level: "critical"|"high"|"medium"|"low", direction: string, reasoning: string}';
COMMENT ON COLUMN news_items.ai_processed_at IS 'Timestamp when AI analysis was completed';
