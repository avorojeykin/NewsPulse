-- NewsPulse Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Whop)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whop_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'free',
    preferences JSONB DEFAULT '{
        "crypto_enabled": true,
        "stocks_enabled": true,
        "sports_enabled": true,
        "x_feed_handle": null
    }'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiences table (Whop app installations)
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whop_experience_id VARCHAR(255) UNIQUE NOT NULL,
    company_id VARCHAR(255),
    settings JSONB DEFAULT '{
        "crypto_channel": "crypto-news",
        "stocks_channel": "stocks-news",
        "sports_channel": "sports-betting"
    }'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News items (for deduplication & analytics)
CREATE TABLE news_items (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- crypto, stocks, sports
    ticker VARCHAR(20), -- Stock ticker symbol (e.g., AAPL, TSLA) - NULL for non-stock news
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 for deduplication
    published_at TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP, -- When sent to Whop (after 15-min delay)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- X (Twitter) feeds (1 per community for free tier)
CREATE TABLE x_feeds (
    id SERIAL PRIMARY KEY,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    handle VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- crypto, stocks, sports
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experience_id, handle)
);

-- Delivery logs (analytics)
CREATE TABLE delivery_logs (
    id SERIAL PRIMARY KEY,
    news_item_id INTEGER REFERENCES news_items(id),
    experience_id UUID REFERENCES experiences(id),
    channel VARCHAR(100),
    tier VARCHAR(50),
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_news_hash ON news_items(hash);
CREATE INDEX idx_news_category ON news_items(category);
CREATE INDEX idx_news_ticker ON news_items(ticker);
CREATE INDEX idx_news_category_ticker ON news_items(category, ticker);
CREATE INDEX idx_news_published ON news_items(published_at DESC);
CREATE INDEX idx_news_delivered ON news_items(delivered_at);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_experiences_active ON experiences(active);
CREATE INDEX idx_x_feeds_experience ON x_feeds(experience_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE news_items IS 'Stores all news items for deduplication and delayed delivery';
COMMENT ON COLUMN news_items.delivered_at IS 'NULL until 15-min delay passes, then set when sent to Whop';
COMMENT ON TABLE x_feeds IS 'One X feed per community for free tier, up to 10 for premium';
COMMENT ON COLUMN users.tier IS 'free, premium, or pro';
