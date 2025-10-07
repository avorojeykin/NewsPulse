-- Migration: Add ticker column to news_items table
-- Date: 2025-10-05
-- Purpose: Support ticker-specific news filtering for stocks category

-- Add ticker column
ALTER TABLE news_items
ADD COLUMN ticker VARCHAR(20);

-- Add indexes for ticker filtering
CREATE INDEX idx_news_ticker ON news_items(ticker);
CREATE INDEX idx_news_category_ticker ON news_items(category, ticker);

-- Add comment
COMMENT ON COLUMN news_items.ticker IS 'Stock ticker symbol (e.g., AAPL, TSLA) - NULL for non-stock news';
