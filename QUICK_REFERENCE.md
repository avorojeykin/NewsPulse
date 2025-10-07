# NewsPulse - Quick Reference

## 📁 Project Structure

```
newspulse/
├── CLAUDE.md              # Complete technical documentation
├── README.md              # Project overview
├── GETTING_STARTED.md     # Setup guide
├── TIER_STRUCTURE.md      # Business model
├── PROJECT_STATUS.md      # Current progress
├── docker-compose.yml     # Local PostgreSQL + Redis
├── .gitignore
│
├── frontend/              # Next.js app
│   ├── app/
│   ├── components/
│   └── lib/
│
├── backend/               # News workers
│   └── src/
│       ├── workers/       # Crypto, stocks, sports, X monitor
│       ├── services/      # News processing
│       └── queues/        # BullMQ setup
│
├── database/
│   └── schema.sql         # PostgreSQL schema
│
└── shared/                # Shared types
```

## 🎯 MVP Features (Free Tier)

| Feature | Status |
|---------|--------|
| Crypto news | 🔄 In progress |
| Stocks news | 🔄 In progress |
| Sports news | 🔄 In progress |
| 1 X feed | 📋 Planned |
| 15-min delay | 📋 Planned |
| Whop integration | 📋 Planned |

## 💰 Tier Breakdown

| Tier | Price | Delay | X Feeds | AI | Launch |
|------|-------|-------|---------|-----|--------|
| Free | $0 | 15 min | 1 | No | Now |
| Premium | $49/mo | None | 10 | No | Month 3+ |
| Pro | $149/mo | None | 10 | Yes | Month 6+ |

## 🔑 Required API Keys

| Service | Free Tier | Cost | Priority |
|---------|-----------|------|----------|
| Whop | Yes | Free | Critical |
| CoinGecko | Demo | $129/mo | High |
| NewsAPI | 100/day | $449/mo | High |
| Alpha Vantage | 25/day | Free | Medium |
| Odds API | 500/mo | $50/mo | Medium |
| Twitter | Limited | $200/mo | Low |

## ⚙️ Quick Commands

### Local Development
```bash
# Start services
docker-compose up -d

# Setup database
docker exec -it newspulse-postgres psql -U postgres -d newspulse -f /docker-entrypoint-initdb.d/01-schema.sql

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Database
```bash
# Connect to database
docker exec -it newspulse-postgres psql -U postgres -d newspulse

# View tables
\dt

# View news items
SELECT * FROM news_items ORDER BY published_at DESC LIMIT 10;

# Check X feeds
SELECT * FROM x_feeds;

# Exit
\q
```

### Redis
```bash
# Connect to Redis
docker exec -it newspulse-redis redis-cli

# View all keys
KEYS *

# Check specific key
GET news:hash123

# Exit
exit
```

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Whop user profiles |
| `experiences` | Whop app installations |
| `news_items` | All news (with 15-min delay tracking) |
| `x_feeds` | Twitter accounts to monitor (1 per community) |
| `delivery_logs` | Analytics and tracking |

## 🔄 News Flow

```
1. Worker fetches news every 30 seconds
2. Generate hash (title + content)
3. Check Redis for duplicate
4. If new → Save to database
5. Add to BullMQ delayed queue (15 minutes)
6. After delay → Send to Whop channel
7. Mark as delivered
```

## 📝 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_WHOP_APP_ID=
WHOP_API_KEY=
DATABASE_URL=
REDIS_URL=
BACKEND_WORKER_URL=http://localhost:3001
```

### Backend (.env)
```env
WHOP_API_KEY=
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/newspulse
REDIS_URL=redis://localhost:6379
NEWSAPI_KEY=
COINGECKO_API_KEY=
ALPHA_VANTAGE_KEY=
ODDS_API_KEY=
TWITTER_BEARER_TOKEN=
PORT=3001
NODE_ENV=development
```

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Port 5432 in use | Change port in docker-compose.yml |
| Redis won't connect | `docker-compose restart redis` |
| API rate limit | Implement caching, upgrade tier |
| Whop messages fail | Check API key, verify channel names |
| Duplicates appearing | Check Redis connection, verify hash logic |

## 📈 Success Metrics (MVP)

- [ ] <30 sec news fetch latency
- [ ] >99% uptime
- [ ] <1% API error rate
- [ ] >90% deduplication accuracy
- [ ] 10+ communities installed
- [ ] 100+ active users
- [ ] 1000+ news items/day

## 🎯 Development Priorities

### Week 2 (Current)
1. Crypto worker (CoinGecko + NewsAPI)
2. Basic deduplication
3. Database integration
4. Simple Whop message sending

### Week 3
1. Stocks worker (Alpha Vantage)
2. Sports worker (Odds API)
3. X monitor (1 feed)
4. 15-minute delay system

### Week 4
1. Frontend (Next.js + Whop SDK)
2. End-to-end testing
3. Bug fixes
4. Deploy to production

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway)
```bash
cd backend
railway up
```

## 📚 Documentation Links

- [CLAUDE.md](CLAUDE.md) - Full technical docs
- [README.md](README.md) - Project overview
- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup guide
- [TIER_STRUCTURE.md](TIER_STRUCTURE.md) - Monetization
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status

## 💡 Key Decisions

1. **15-minute delay** = Fair free tier + upgrade incentive
2. **1 X feed** = Shows value, encourages premium
3. **3 categories** = Comprehensive MVP
4. **No AI in MVP** = Focus on core aggregation
5. **BullMQ** = Reliable delayed job processing

## ⚠️ Important Notes

- Free tier APIs may rate limit - cache aggressively
- Test deduplication thoroughly before production
- 15-minute delay uses PostgreSQL timestamp + BullMQ
- Whop channels must be created manually in community
- X monitoring: simple polling (1 min) for MVP, real-time for Premium

## 🎓 Learning Resources

- Whop SDK: https://docs.whop.com
- BullMQ: https://docs.bullmq.io
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs

---

**Last Updated**: 2025-10-04
**Current Phase**: Week 1 Complete ✅
**Next Milestone**: Crypto worker functional
