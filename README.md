# NewsPulse - Real-Time News Aggregation for Whop

<div align="center">

**⚡ Breaking news delivered 30-60 seconds faster than free sources**

[![Whop](https://img.shields.io/badge/Platform-Whop-purple?style=for-the-badge)](https://whop.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

</div>

## 🎯 Overview

NewsPulse is a news aggregation platform that delivers breaking news to Whop communities across Crypto, Stocks, and Sports Betting.

**✅ Phase 1 Complete - Free Tier MVP**:
- **🪙 Crypto** - 4 RSS feeds (CoinDesk, Cointelegraph, Decrypt, CryptoSlate)
- **📈 Stocks** - 5 RSS feeds (Yahoo Finance, MarketWatch, Seeking Alpha, Benzinga, CNBC)
- **🏀 Sports** - 4 RSS feeds (ESPN, CBS Sports, Yahoo Sports, Bleacher Report)
- **⏱️ 15-minute delay** on all news delivery
- **🔄 Deduplication** - Smart hash-based duplicate prevention
- **💰 Zero API costs** - All free RSS feeds

**🔄 Phase 2 - X (Twitter) Integration** (Coming Soon):
- 🐦 Real-time feeds from key X accounts
- Free: 1 account | Premium: 10 accounts

**🚀 Premium Tier** ($49/mo):
- ⚡ Real-time delivery (no delay)
- 🐦 10 X feed connections
- 🎯 Priority message delivery

**🤖 Pro Tier** ($149/mo):
- Everything in Premium PLUS:
- 🧠 AI summaries (GPT-4)
- 📊 Sentiment analysis (Bullish/Bearish/Neutral)
- 🎯 Price impact predictions
- 🏷️ Entity extraction & tagging
- 📈 Trend analysis
- ❓ Question answering
- See `AI_FEATURES.md` for full details

## ✨ Key Features

**Working Now** (Phase 1):
- 📰 **14 RSS feeds** across 3 categories
- ⏱️ **15-min delay** via BullMQ job queues
- 🔄 **Deduplication** via SHA-256 hashing
- 💾 **PostgreSQL storage** with Redis cache
- 🎨 **Clean UI** with tab navigation in Whop
- 📦 **Easy local setup** with Docker

**Coming Next**:
- Phase 2: X (Twitter) real-time feeds
- Phase 3: Premium tier with real-time delivery
- Phase 4: AI-powered insights and analysis

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│           News Sources (Phase 1)              │
│      14 Free RSS Feeds + X API (Phase 2)     │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│     Workers (Node.js + BullMQ)               │
│    RSS Worker (60s polling) | X Worker       │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│  Processing Pipeline                         │
│  Dedup (Redis) → 15-min delay → Format       │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│  Whop Channels                               │
│  #crypto | #stocks | #sports-betting         │
└──────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Whop Developer Account
- API Keys: CoinGecko, NewsAPI (both have free tiers)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/newspulse.git
cd newspulse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Start local services (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
psql $DATABASE_URL < database/schema.sql

# Start backend workers
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

### Environment Setup

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
BACKEND_WORKER_URL=http://localhost:3001
```

**Backend** (`.env`):
```env
WHOP_API_KEY=your_api_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
NEWSAPI_KEY=your_key
COINGECKO_API_KEY=your_key
PORT=3001
NODE_ENV=development
```

## 📁 Project Structure

```
newspulse/
├── frontend/              # Next.js app (Vercel)
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── experiences/  # Main app view
│   │   └── discover/     # Marketing page
│   ├── components/       # React components
│   └── lib/             # Utilities & SDK
│
├── backend/              # Workers (Railway)
│   ├── src/
│   │   ├── workers/     # News aggregators
│   │   ├── services/    # Processing pipeline
│   │   └── queues/      # BullMQ config
│   └── Dockerfile
│
├── database/            # Migrations & schema
├── shared/              # Shared types
└── CLAUDE.md           # Development docs
```

## 🎨 Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- @whop/sdk

**Backend**
- Node.js + Express
- BullMQ (job queues)
- PostgreSQL + Redis
- OpenAI API

**Deployment**
- Vercel (frontend)
- Railway (backend + DB)

## 💰 Monetization Strategy

| Tier | Price | Features | Timeline |
|------|-------|----------|----------|
| **Free** | $0 | 3 categories, 15-min delay, 1 X feed | MVP (Now) |
| **Premium** | $49/mo | Real-time, 10 X feeds | Phase 2 (Month 3+) |
| **Pro** | $149/mo | Premium + AI summaries + sentiment | Phase 3 (Month 6+) |

**MVP Goal**: Validate with 100+ free users before launching Premium

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Load testing
npm run test:load
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
```

### Backend (Railway)
```bash
cd backend
railway up
```

## 🔧 Development Commands

```bash
# Health check
curl http://localhost:3001/health

# Monitor queue
npm run queue:monitor

# View logs
railway logs --tail

# Database inspection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM news_items"
```

## 📈 Roadmap

**Phase 1 - Free Tier MVP (Current)**
- [x] Repository setup
- [ ] Crypto worker (CoinGecko + NewsAPI)
- [ ] Stocks worker (Alpha Vantage)
- [ ] Sports worker (Odds API)
- [ ] X monitor (1 feed)
- [ ] 15-minute delay system
- [ ] Whop integration
- [ ] Basic frontend
- [ ] Deploy & test

**Phase 2 - Premium Tier (Month 3+)**
- [ ] Remove delay for premium users
- [ ] 10 X feeds support
- [ ] Real-time delivery
- [ ] Launch at $49/mo

**Phase 3 - Pro Tier (Month 6+)**
- [ ] AI summaries (OpenAI)
- [ ] Sentiment analysis
- [ ] Custom filtering
- [ ] Launch at $149/mo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

- 📧 Email: support@newspulse.app
- 💬 Discord: [Join our community](#)
- 📚 Docs: [CLAUDE.md](CLAUDE.md)

## 🙏 Acknowledgments

- Whop platform and SDK
- OpenAI for AI capabilities
- All news API providers

---

<div align="center">

**Built with ❤️ for the Whop community**

[Website](#) • [Documentation](CLAUDE.md) • [Report Bug](#) • [Request Feature](#)

</div>
