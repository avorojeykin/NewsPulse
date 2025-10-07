# 🚀 NewsPulse - Quick Start Guide

**Everything you need to start developing and testing locally.**

---

## 📋 Prerequisites

✅ **Required Software:**
- Docker Desktop (for PostgreSQL + Redis)
- Node.js 20+
- npm or yarn
- Git

✅ **Already Configured:**
- Environment variables (`.env` files)
- Database migrations ready
- Whop credentials set up

---

## 🔧 Step 1: Start Docker Services

### 1.1 Start Docker Desktop
- Open Docker Desktop application
- Wait for it to fully start (green indicator)

### 1.2 Start PostgreSQL + Redis
```bash
cd C:\Users\avoro\Desktop\NewsPulse

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# newspulse-postgres  running  0.0.0.0:5432
# newspulse-redis     running  0.0.0.0:6379
```

### 1.3 Verify Database
```bash
# Connect to PostgreSQL
docker exec -it newspulse-postgres psql -U postgres -d newspulse

# List tables (should show: users, experiences, news_items, etc.)
\dt

# Exit
\q
```

---

## 🖥️ Step 2: Start Backend Services

### 2.1 Start Backend API Server

**Terminal 1:**
```bash
cd C:\Users\avoro\Desktop\NewsPulse\backend

# Install dependencies (if not already done)
npm install

# Start backend server
npm run dev
```

**Expected Output:**
```
✅ Database connected
✅ Redis connected
🚀 Backend server running on http://localhost:3001
📡 Health check: http://localhost:3001/health
📰 News API: http://localhost:3001/api/news
```

### 2.2 Start RSS Worker

**Terminal 2 (New Terminal):**
```bash
cd C:\Users\avoro\Desktop\NewsPulse\backend

# Start RSS worker
npm run worker:rss
npm run worker:processor
```

**Expected Output:**
```
✅ RSS worker started - fetching every 60 seconds
🔄 Starting RSS fetch cycle...
✅ Processed: [crypto] Bitcoin Hits New All-Time High...
✅ Processed: [stocks] Apple Reports Record Earnings...
```

---

## 🎨 Step 3: Start Frontend

**Terminal 3 (New Terminal):**
```bash
cd C:\Users\avoro\Desktop\NewsPulse\frontend

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

---

## 🧪 Step 4: Test Everything

### 4.1 Test Backend Health

**Terminal 4 (New Terminal):**
```bash
# Test health check
curl http://localhost:3001/health

# Expected: {"status":"healthy","database":"connected"}
```

### 4.2 Test Tier API
```bash
# Check user tier (using your Whop user ID)
curl http://localhost:3001/api/tier/user_4qA1XSxyMURpW

# Expected:
# {
#   "userId": "user_4qA1XSxyMURpW",
#   "tier": "free" or "premium",
#   "isPremium": false or true,
#   "deliveryDelay": 900000 or 0,
#   "deliveryDelayMinutes": 15 or 0
# }
```

### 4.3 Test News APIs
```bash
# Test crypto news
curl http://localhost:3001/api/news/crypto?limit=3

# Test stocks news
curl http://localhost:3001/api/news/stocks?limit=3

# Test sports news
curl http://localhost:3001/api/news/sports?limit=3

# Expected: JSON with news array
```

### 4.4 Test Frontend in Browser

**Open Browser:**
1. Visit: **http://localhost:3000**
2. ✅ Category landing page loads with logo
3. ✅ Click **"Crypto"** → News feeds display
4. ✅ Click **"Stocks"** → Ticker search appears
5. ✅ Click **"Sports"** → Sports news loads
6. ✅ See "Upgrade to Premium - $4.99/mo" message
7. ✅ News items load from all 3 categories

---

## 🔍 Step 5: Verify Database Has News

```bash
# Connect to database
docker exec -it newspulse-postgres psql -U postgres -d newspulse

# Check news count
SELECT COUNT(*) FROM news_items;

# Check news by category
SELECT category, COUNT(*) as count
FROM news_items
GROUP BY category;

# View recent news
SELECT source, title, published_at
FROM news_items
ORDER BY published_at DESC
LIMIT 10;

# Exit
\q
```

---

## 📊 Running Services Checklist

When everything is running, you should have:

- ✅ **Docker Desktop**: Running (green icon)
- ✅ **PostgreSQL**: Container running on port 5432
- ✅ **Redis**: Container running on port 6379
- ✅ **Backend API**: Terminal 1 running on http://localhost:3001
- ✅ **RSS Worker**: Terminal 2 fetching news every 60 seconds
- ✅ **Frontend**: Terminal 3 running on http://localhost:3000

---

## 🛑 Stopping Everything

### Stop Services (When Done Testing)
```bash
# Stop frontend (Terminal 3)
Ctrl + C

# Stop RSS worker (Terminal 2)
Ctrl + C

# Stop backend (Terminal 1)
Ctrl + C

# Stop Docker containers
cd C:\Users\avoro\Desktop\NewsPulse
docker-compose down
```

---

## 🔄 Quick Restart (Next Time)

```bash
# 1. Start Docker Desktop (application)

# 2. Start Docker services
cd C:\Users\avoro\Desktop\NewsPulse
docker-compose up -d

# 3. Terminal 1: Backend
cd backend && npm run dev

# 4. Terminal 2: RSS Worker
cd backend && npm run worker:rss

# 5. Terminal 3: Frontend
cd frontend && npm run dev

# 6. Browser: http://localhost:3000
```

---

## 🐛 Troubleshooting

### Docker won't start
```bash
# Check if Docker Desktop is running
# Look for whale icon in system tray

# Restart Docker Desktop
# Right-click whale icon → Restart
```

### Port already in use
```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=3002
```

### Database connection error
```bash
# Check PostgreSQL is running
docker ps | findstr postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### No news appearing
```bash
# Check RSS worker is running (Terminal 2)
# Should see: "✅ Processed: [category] Title..."

# If not seeing logs:
# 1. Stop worker (Ctrl+C)
# 2. Restart: npm run worker:rss

# Check database
docker exec -it newspulse-postgres psql -U postgres -d newspulse -c "SELECT COUNT(*) FROM news_items;"
```

### Frontend 404 errors
```bash
# Make sure backend is running on port 3001
curl http://localhost:3001/health

# Check frontend .env.local has correct API URL
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📚 Environment Variables Summary

**Backend (.env):**
```bash
WHOP_API_KEY=4L9jMYwxTBdTppandoQxmOs3Q1JwlMYPY_oGU_OAb5M
WHOP_APP_ID=app_TmDTD84xZLAjXC
WHOP_PREMIUM_ACCESS_PASS_ID=prod_RnrOkr6tAwSWq
DATABASE_URL=postgresql://postgres:12345@localhost:5432/newspulse
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development
```

**Frontend (.env.local):**
```bash
WHOP_API_KEY=4L9jMYwxTBdTppandoQxmOs3Q1JwlMYPY_oGU_OAb5M
NEXT_PUBLIC_WHOP_APP_ID=app_TmDTD84xZLAjXC
NEXT_PUBLIC_WHOP_PREMIUM_ACCESS_PASS_ID=prod_RnrOkr6tAwSWq
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎯 What You Should See

### Backend Logs (Terminal 1):
```
✅ Database connected
✅ Redis connected
🚀 Backend server running on http://localhost:3001
```

### RSS Worker Logs (Terminal 2):
```
🔄 Starting RSS fetch cycle...
📰 Fetching from CoinDesk...
✅ Processed: [crypto] Bitcoin Surges Past $50K...
📰 Fetching from Yahoo Finance...
✅ Processed: [stocks] Tesla Stock Jumps 5%...
```

### Frontend:
- Landing page with NewsPulse logo
- 3 category cards (Crypto, Stocks, Sports)
- News feeds with articles
- "36 Premium Sources" stat
- "Upgrade to Premium - $4.99/mo" button

---

## ✅ You're Ready When...

- ✅ All 4 terminals running without errors
- ✅ Browser shows news in all 3 categories
- ✅ Database has news items (`SELECT COUNT(*) FROM news_items;` > 0)
- ✅ RSS worker logs show successful processing
- ✅ Health check returns `{"status":"healthy"}`

---

## 🚀 Next Steps

Once everything is working locally:

1. ✅ Test thoroughly with all categories
2. ✅ Verify ticker search in Stocks
3. ✅ Check tier API with your user ID
4. ✅ Follow **[FINAL_DEPLOYMENT_CHECKLIST.md](FINAL_DEPLOYMENT_CHECKLIST.md)** to deploy to production

---

## 📞 Need Help?

**Documentation:**
- [FINAL_DEPLOYMENT_CHECKLIST.md](FINAL_DEPLOYMENT_CHECKLIST.md) - Production deployment
- [TIER_QUICK_START.md](TIER_QUICK_START.md) - Tier system details
- [README_DEPLOYMENT.md](README_DEPLOYMENT.md) - Quick overview

**Common Commands:**
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart everything
docker-compose restart

# Fresh start (removes all data)
docker-compose down -v
docker-compose up -d
```

---

**You're all set!** Start with Step 1 and work your way through. 🎉
