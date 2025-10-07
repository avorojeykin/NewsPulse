# NewsPulse Backend

RSS-based news aggregation backend with BullMQ job queues and 15-minute delay implementation.

## Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start services** (PostgreSQL + Redis):
```bash
# From project root
docker-compose up -d
```

4. **Run database migrations**:
```bash
# From project root
docker exec -i newspulse-postgres psql -U postgres -d newspulse < database/schema.sql
```

## Running Workers

### Start RSS Worker (Fetches RSS feeds every 60 seconds)
```bash
npm run worker:rss
```

### Start News Processor (Processes queued news items)
```bash
npm run worker:processor
```

### Start API Server (Serves news to frontend)
```bash
npm run dev
```

## Architecture

### RSS Worker (`src/workers/rss.worker.ts`)
- Polls 15 RSS feeds every 60 seconds
- Fetches 5 most recent items per feed
- Queues items with 15-minute delay (free tier)
- Respectful 500ms delay between feeds

### News Processor (`src/workers/news.processor.ts`)
- Processes news items from BullMQ queue
- Checks for duplicates via Redis (SHA-256 hash)
- Stores in PostgreSQL database
- Concurrency: 5 items at once

### API Server (`src/index.ts`)
- Health check: `GET /health`
- All news: `GET /api/news?limit=20`
- By vertical: `GET /api/news/:vertical?limit=20`

## News Sources

### Crypto (5 feeds)
- CoinDesk, Cointelegraph, Decrypt, CryptoSlate, Bitcoin Magazine

### Stocks (5 feeds)
- Yahoo Finance, MarketWatch, Seeking Alpha, Benzinga, CNBC

### Sports (4 feeds)
- ESPN, Bleacher Report, CBS Sports, Yahoo Sports

## Testing

```bash
# Check health
curl http://localhost:3001/health

# Get recent crypto news
curl http://localhost:3001/api/news/crypto

# Get all news
curl http://localhost:3001/api/news?limit=10
```

## Production Deployment

1. **Railway** (recommended for backend workers)
2. Set environment variables in Railway dashboard
3. Deploy with:
```bash
npm run build
npm start
```
