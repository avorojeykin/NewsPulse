# NewsPulse - Development Documentation

## Project Overview

NewsPulse is a real-time news aggregation platform for Whop that delivers breaking news across three verticals: Crypto, Stocks, and Sports Betting.

**Current Phase**: Phase 1.5 - ✅ COMPLETE

**Status**:
- ✅ RSS news aggregation working (36 feeds: 12 crypto + 12 stocks + 12 sports)
- ✅ Ticker-specific news filtering (Yahoo Finance, MarketWatch, Seeking Alpha)
- ✅ 15-minute delay implementation working
- ✅ Modern frontend with category landing page and themed UI
- ✅ Deduplication and database storage working
- ✅ 598 unique stock tickers with autocomplete search
- 🔄 X (Twitter) integration - PENDING (Phase 2)
- 🔄 AI features - PENDING (Phase 3)

**News Sources**:
- **RSS Feeds**: 36 premium sources (12 per category)
- **Ticker-Specific**: 3 RSS sources per stock ticker (up to 30 articles per ticker)
- **X (Twitter)**: Real-time breaking news from key accounts (1 feed per community - Phase 2)

## Architecture Documentation

### System Architecture
- **Frontend**: Next.js 15.3.2 with TypeScript, embedded in Whop
- **Backend**: Node.js workers with BullMQ job queues
- **Database**: PostgreSQL for persistent data with ticker column
- **Cache**: Redis for deduplication and rate limiting
- **Integration**: Whop SDK for authentication and chat delivery

### Data Flow
```
News Sources → Workers → Deduplication (Redis) → Format → Whop Channels
                              ↓
                         Database Storage (with ticker tags)
```

## Technology Stack

### Frontend
- Next.js 15.3.2 (App Router)
- TypeScript
- Tailwind CSS v4
- @whop/sdk
- @headlessui/react (autocomplete)
- Lucide React (icons)

### Backend
- Node.js 20+
- Express.js
- BullMQ (job queues)
- TypeScript
- rss-parser

### Infrastructure
- PostgreSQL (Docker local / Supabase production)
- Redis (Docker local / Upstash production)
- Vercel (frontend hosting)
- Railway (backend hosting)

### News Sources

**Currently Active (36 RSS Feeds)**:

**Crypto (12 feeds)**:
- CoinDesk, Cointelegraph, Decrypt, CryptoSlate
- Bitcoin Magazine, The Block, Bitcoin.com
- CryptoNews, NewsBTC, CoinJournal
- CryptoDaily, Crypto Briefing

**Stocks (12 feeds)**:
- Yahoo Finance, MarketWatch, Seeking Alpha, Benzinga, CNBC
- Reuters Business, Barron's, The Motley Fool
- Investopedia, Bloomberg Markets
- Financial Times, Forbes Markets

**Sports Betting (12 feeds)**:
- ESPN, Bleacher Report, CBS Sports, Yahoo Sports
- Action Network, Covers, Sports Betting Dime
- The Lines, Sports Handle
- Oddschecker, Pickswise, BettingPros

**Ticker-Specific (3 sources per ticker)**:
- Yahoo Finance: `https://finance.yahoo.com/rss/headline?s={TICKER}`
- MarketWatch: `https://www.marketwatch.com/rss/stock/{TICKER}`
- Seeking Alpha: `https://seekingalpha.com/api/sa/combined/{TICKER}.xml`

**X API v2** (Phase 2): Real-time filtered stream for monitored accounts
- Free tier: 1 account per community
- Premium tier: Up to 10 accounts

**Dependencies**: `rss-parser` for RSS parsing, `@headlessui/react` for autocomplete

## Database Schema

### Core Tables
1. **users** - User profiles synced from Whop
2. **experiences** - Whop app installations
3. **news_items** - Aggregated news with deduplication and ticker tags
4. **twitter_accounts** - Monitored X accounts
5. **delivery_logs** - Analytics and tracking

### Key Indexes
- news_items.hash (deduplication)
- news_items.vertical (filtering)
- news_items.ticker (stock filtering)
- news_items.category_ticker (composite index)
- news_items.published_at (sorting)

### Recent Migrations
- **001_add_ticker_column.sql** - Added ticker support for stock filtering

## Feature Implementation

### Ticker Filtering System (NEW - Phase 1.5)

**Frontend**:
- Autocomplete search with 598 unique tickers
- Popular ticker quick filters (AAPL, TSLA, NVDA, etc.)
- Only visible in Stocks category
- Uses @headlessui/react Combobox

**Backend**:
- Fetches from 3 RSS sources per ticker in parallel
- Up to 10 items per source = 30 articles per ticker
- Stores with ticker tag in database
- API endpoint: `/api/news/stocks?ticker=AAPL`

**Worker**: `ticker.worker.ts`
- Parallel fetching from multiple sources
- Automatic deduplication across sources
- Real-time on-demand fetching when user searches

### Tier-Based Access Control

**Free Tier** (MVP - Current Focus):
- All 3 categories: Crypto, Stocks, Sports Betting
- 15-minute delay on news delivery
- Ticker filtering for stocks (598 tickers)
- 1 X (Twitter) feed connection per community
- Posted to Whop channels

**Premium Tier** ($49/mo - Phase 2):
- Real-time news delivery (no delay)
- Up to 10 X feed connections
- Priority message delivery

**Pro Tier** ($149/mo - Phase 3):
- Everything in Premium
- AI-Powered Features (see AI_FEATURES.md for full specs)

### Deduplication Strategy
- Generate SHA-256 hash from title + url
- Store in Redis with 24-hour TTL
- Skip processing if hash exists
- Cross-source deduplication (prevents same article from multiple feeds)

## RSS Feed Implementation

### RSS Worker Architecture

**Polling Frequency**: 60 seconds
- Fetches 5 most recent items per feed
- Processes all verticals in parallel
- Respectful 500ms delay between feeds
- Total: ~36 feeds × 5 items = 180 items per minute max

**Deduplication**:
- Hash: SHA-256 of `title + url`
- Stored in Redis with 24-hour TTL
- Prevents duplicate news across feeds and sources

### Ticker Worker (NEW)

**Sources per Ticker**: 3 parallel RSS feeds
- Yahoo Finance (primary)
- MarketWatch (secondary)
- Seeking Alpha (tertiary)

**On-Demand Fetching**:
- Triggered when user searches for ticker
- Fetches up to 10 items per source (30 total)
- Parallel execution for speed
- Automatic deduplication across sources

## Frontend Implementation

### Theme System ([frontend/lib/theme.ts](frontend/lib/theme.ts))
- Comprehensive design token system
- Category-specific color palettes:
  - Crypto: Orange (#f59e0b)
  - Stocks: Green (#10b981)
  - Sports: Blue (#3b82f6)
  - X Mentions: Purple (#8b5cf6)

### Key Components
1. **CategoryLanding** - Main landing page with 36 Premium Sources stat
2. **CategoryCard** - Interactive cards with category theming
3. **NewsFeeds** - News display with HOT badges and time-ago
4. **TickerSearch** (NEW) - Stock filtering with autocomplete

## Project Timeline

### ✅ Phase 1: MVP Foundation (COMPLETE)
- ✅ 14 RSS feeds working
- ✅ Deduplication and 15-min delay
- ✅ Frontend with tab navigation
- ✅ Database and Redis setup

### ✅ Phase 1.5: RSS Expansion & UI Redesign (COMPLETE)
- ✅ Expanded to 36 RSS feeds (12 per category)
- ✅ Added ticker-specific filtering (3 sources per ticker)
- ✅ 598 unique stock tickers with autocomplete
- ✅ Modern theme system with category landing page
- ✅ Updated all source count displays

### 📋 Phase 2: X (Twitter) Integration (Next)
- Setup X API v2 Developer Account
- Implement filtered stream
- Real-time tweet processing

### 🚀 Phase 3: Premium Features
- Remove 15-minute delay for Premium
- 10 X feed connections
- Tier-based access control

### 🤖 Phase 4: AI Features
- Smart summaries, sentiment analysis
- See AI_FEATURES.md for full specs

## Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main technical documentation (this file) |
| `TICKER_FILTER_PLAN.md` | Ticker filtering implementation plan |
| `AI_FEATURES.md` | AI features specification (Phase 4) |
| `X_INTEGRATION_GUIDE.md` | X API integration guide (Phase 2) |
| `TIER_STRUCTURE.md` | Business model and pricing |
| `README.md` | Project overview |

---

**Last Updated**: 2025-10-06
**Current Status**: Phase 1.5 Complete - Ready for Phase 2 (X Integration)
**Next Milestone**: X (Twitter) Real-Time Integration
