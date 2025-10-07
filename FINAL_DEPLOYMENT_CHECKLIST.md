# 🚀 NewsPulse - Final Deployment Checklist

Complete checklist to go from development to production.

---

## ✅ Phase 1: Local Testing (Do This First)

### 1. Backend Testing

**Start Backend:**
```bash
cd backend
npm run dev
```

**Test Health Check:**
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy","database":"connected"}
```

**Test Tier API:**
```bash
# Test with your Whop user ID (or a test user)
curl http://localhost:3001/api/tier/user_4qA1XSxyMURpW

# Expected response:
{
  "userId": "user_4qA1XSxyMURpW",
  "tier": "free" or "premium",
  "isPremium": false or true,
  "deliveryDelay": 900000 or 0,
  "deliveryDelayMinutes": 15 or 0
}
```

**Test News API:**
```bash
# Test crypto news
curl http://localhost:3001/api/news/crypto?limit=5

# Test stocks news
curl http://localhost:3001/api/news/stocks?limit=5

# Test sports news
curl http://localhost:3001/api/news/sports?limit=5
```

**Start RSS Worker:**
```bash
cd backend
npm run worker:rss
# Should show: "✅ RSS worker started - fetching every 60 seconds"
```

### 2. Frontend Testing

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**Test in Browser:**
1. Visit: http://localhost:3000
2. ✅ Category landing page loads
3. ✅ Click "Crypto" → News feeds display
4. ✅ Click "Stocks" → Ticker search works
5. ✅ Click "Sports" → Sports news loads
6. ✅ All 3 categories show news items
7. ✅ "Upgrade to Premium - $4.99/mo" button shows

### 3. Database Check

```bash
# Connect to local database
psql postgresql://postgres:12345@localhost:5432/newspulse

# Check tables exist
\dt

# Check news items
SELECT COUNT(*) FROM news_items;
SELECT category, COUNT(*) FROM news_items GROUP BY category;

# Check for recent news
SELECT source, title, published_at FROM news_items ORDER BY published_at DESC LIMIT 5;
```

---

## ✅ Phase 2: Production Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. **Name**: `newspulse-production`
4. **Region**: Choose closest to your users (e.g., US East)
5. **Database Password**: Create strong password → **SAVE IT!**
6. Wait for project to be ready (~2 minutes)

### 2. Get Connection String

1. In Supabase dashboard → Settings → Database
2. Copy **Connection string** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password
4. Example: `postgresql://postgres:YOUR_PASSWORD@db.abc123.supabase.co:5432/postgres`

### 3. Run Migrations

```bash
# From your local machine
cd backend

# Run all migrations
psql "postgresql://postgres:YOUR_PASSWORD@db.abc123.supabase.co:5432/postgres" -f migrations/001_initial_schema.sql
psql "postgresql://postgres:YOUR_PASSWORD@db.abc123.supabase.co:5432/postgres" -f migrations/002_add_ticker_column.sql
psql "postgresql://postgres:YOUR_PASSWORD@db.abc123.supabase.co:5432/postgres" -f migrations/003_add_tier_system.sql
```

### 4. Verify Tables

```sql
-- Connect to Supabase SQL Editor
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Should show:
-- users
-- experiences
-- news_items
-- twitter_accounts
-- delivery_logs
```

---

## ✅ Phase 3: Redis Setup (Upstash)

### 1. Create Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Click "Create Database"
3. **Name**: `newspulse-redis`
4. **Type**: Regional
5. **Region**: Same as Supabase (e.g., US East)

### 2. Get Connection Details

1. Click on your database
2. Copy these values:
   - **Endpoint**: `your-db.upstash.io`
   - **Port**: `6379`
   - **Password**: `your_password`

3. **Connection String Format**:
   ```
   redis://default:YOUR_PASSWORD@your-db.upstash.io:6379
   ```

---

## ✅ Phase 4: Backend Deployment (Railway)

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login and Initialize

```bash
# Login
railway login

# From backend directory
cd backend

# Initialize project
railway init
# Name: newspulse-backend
```

### 3. Add Environment Variables

```bash
# Database
railway variables set DATABASE_URL="postgresql://postgres:PASSWORD@db.abc123.supabase.co:5432/postgres"

# Redis
railway variables set REDIS_URL="redis://default:PASSWORD@db.upstash.io:6379"
railway variables set REDIS_HOST="db.upstash.io"
railway variables set REDIS_PORT="6379"
railway variables set REDIS_PASSWORD="your_password"

# Whop
railway variables set WHOP_API_KEY="4L9jMYwxTBdTppandoQxmOs3Q1JwlMYPY_oGU_OAb5M"
railway variables set WHOP_APP_ID="app_TmDTD84xZLAjXC"
railway variables set WHOP_PREMIUM_ACCESS_PASS_ID="prod_RnrOkr6tAwSWq"

# Server
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
```

### 4. Deploy

```bash
# Build
npm run build

# Deploy
railway up

# Get deployment URL
railway domain
# Example: newspulse-backend.up.railway.app
```

### 5. Verify Deployment

```bash
# Test health
curl https://newspulse-backend.up.railway.app/health

# Test tier API
curl https://newspulse-backend.up.railway.app/api/tier/user_4qA1XSxyMURpW

# Test news API
curl https://newspulse-backend.up.railway.app/api/news/crypto?limit=3
```

### 6. Start RSS Worker on Railway

**Option A: Add as separate service**
1. Railway dashboard → New Service
2. Use same repo
3. Start command: `npm run worker:rss`
4. Same environment variables

**Option B: Single service with process manager**
Create `Procfile`:
```
web: npm start
worker: npm run worker:rss
```

---

## ✅ Phase 5: Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
# From frontend directory
cd frontend

# Login
vercel login

# Deploy
vercel
```

### 3. Add Environment Variables

In Vercel dashboard:
1. Select your project
2. Settings → Environment Variables
3. Add:

```bash
WHOP_API_KEY=4L9jMYwxTBdTppandoQxmOs3Q1JwlMYPY_oGU_OAb5M
NEXT_PUBLIC_WHOP_APP_ID=app_TmDTD84xZLAjXC
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_4qA1XSxyMURpW
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_2GA7eXhxfzLutg
NEXT_PUBLIC_WHOP_PREMIUM_ACCESS_PASS_ID=prod_RnrOkr6tAwSWq
NEXT_PUBLIC_API_URL=https://newspulse-backend.up.railway.app
NODE_ENV=production
```

### 4. Deploy to Production

```bash
vercel --prod
```

### 5. Get Production URL

Example: `https://newspulse.vercel.app`

### 6. Test Production Frontend

1. Visit your Vercel URL
2. ✅ Landing page loads
3. ✅ Categories work
4. ✅ News feeds load
5. ✅ Ticker search works

---

## ✅ Phase 6: Whop App Store Setup

### 1. Configure App in Whop Dashboard

1. Go to Whop Developer Dashboard
2. Select your app
3. **Settings**:
   - App Name: NewsPulse
   - App URL: `https://newspulse.vercel.app`
   - Category: News & Media

### 2. Access Passes Configuration

You already have:
- ✅ **Premium Access Pass**: `prod_RnrOkr6tAwSWq` at $4.99/mo

**Optional: Create Free Access Pass**
1. Whop Dashboard → Access Passes → Create
2. Name: "Free Tier"
3. Price: $0
4. Save Access Pass ID for reference

### 3. App Description

**Short Description:**
```
Real-time news aggregation for Crypto, Stocks, and Sports Betting. 36 premium sources, smart deduplication, beautiful UI.
```

**Long Description:**
```
NewsPulse delivers breaking news across three high-demand verticals:

🪙 Cryptocurrency
- CoinDesk, Cointelegraph, Decrypt, CryptoSlate, and 8 more sources
- Real-time alerts for Bitcoin, Ethereum, DeFi, NFTs, altcoins

📈 Stock Markets
- Yahoo Finance, MarketWatch, Seeking Alpha, Benzinga, CNBC, and more
- Filter by 598+ stock tickers (AAPL, TSLA, NVDA, etc.)
- Earnings reports, SEC filings, market analysis

🏈 Sports Betting
- ESPN, Bleacher Report, CBS Sports, Action Network, Covers, and more
- Injury reports, line movements, odds changes
- All major sports covered

Features:
• 36 Premium RSS Sources (12 per category)
• Real-time updates every 60 seconds
• Stock ticker filtering with autocomplete
• Smart deduplication across sources
• Beautiful themed UI with category-specific design
• Mobile responsive

Free Tier: 15-minute delayed news delivery
Premium Tier ($4.99/mo): Real-time delivery, instant alerts
```

### 4. Upload Assets

Required:
- **App Icon**: 512x512px PNG (use `/public/logo.png`)
- **Screenshots** (at least 3):
  1. Category landing page
  2. Crypto news feed
  3. Stocks with ticker search
- **Banner**: 1920x1080px (optional but recommended)

### 5. Submit for Review

1. Review all information
2. Agree to Terms of Service
3. Click **"Submit for Review"**
4. Wait 2-5 business days for approval

---

## ✅ Phase 7: Post-Deployment Verification

### 1. End-to-End Test

**Backend:**
```bash
curl https://newspulse-backend.up.railway.app/health
curl https://newspulse-backend.up.railway.app/api/news/crypto?limit=3
curl https://newspulse-backend.up.railway.app/api/tier/user_4qA1XSxyMURpW
```

**Frontend:**
1. Visit: `https://newspulse.vercel.app`
2. Test all 3 categories
3. Test ticker search
4. Verify tier messaging shows

**RSS Worker:**
1. Check Railway logs: `railway logs`
2. Look for: "✅ Processed: [crypto] Breaking news..."
3. Verify news appearing in database

### 2. Database Check

```sql
-- Connect to Supabase
SELECT category, COUNT(*) as count FROM news_items
GROUP BY category;

-- Should show news in all 3 categories
```

### 3. Tier System Test

```bash
# Test with a real user who has Premium
curl https://newspulse-backend.up.railway.app/api/tier/REAL_USER_ID

# Should return tier and delay correctly
```

---

## ✅ Phase 8: Monitoring & Maintenance

### 1. Setup Monitoring

**Railway:**
- View logs: `railway logs`
- Monitor metrics in dashboard
- Set up alerts for downtime

**Vercel:**
- Analytics tab in dashboard
- Monitor page views and API calls
- Check error rates

**Supabase:**
- Database size and performance
- Query performance
- Connection pooling

**Upstash:**
- Memory usage
- Commands/sec
- Hit rate

### 2. Health Check Script

Create `scripts/health-check.sh`:
```bash
#!/bin/bash
echo "Checking NewsPulse health..."

# Backend
echo "Backend health:"
curl -f https://newspulse-backend.up.railway.app/health || exit 1

# Frontend
echo "Frontend health:"
curl -f https://newspulse.vercel.app || exit 1

# API
echo "News API:"
curl -f https://newspulse-backend.up.railway.app/api/news/crypto?limit=1 || exit 1

echo "✅ All systems healthy"
```

Run daily or set up with cron.

---

## 🎉 Success Criteria

### MVP is Live When:
- ✅ Backend healthy and responding
- ✅ Frontend loads and displays news
- ✅ RSS worker fetching news every 60 seconds
- ✅ All 3 categories have news
- ✅ Ticker search works in Stocks
- ✅ Tier API returns correct data
- ✅ Whop app submitted for review
- ✅ No critical errors in logs

---

## 📊 Key URLs (Save These)

**Production:**
- Frontend: `https://newspulse.vercel.app`
- Backend: `https://newspulse-backend.up.railway.app`
- Health: `https://newspulse-backend.up.railway.app/health`

**Dashboards:**
- Vercel: `https://vercel.com/dashboard`
- Railway: `https://railway.app/dashboard`
- Supabase: `https://supabase.com/dashboard`
- Upstash: `https://upstash.com/dashboard`
- Whop: `https://whop.com/dashboard`

**Environment Variables:**
- Backend: Railway dashboard → Variables
- Frontend: Vercel dashboard → Settings → Environment Variables

---

## 🆘 Troubleshooting

### Backend won't start
- Check Railway logs: `railway logs`
- Verify DATABASE_URL is correct
- Verify REDIS_URL is correct
- Check all Whop variables are set

### Frontend 500 errors
- Check Vercel logs
- Verify NEXT_PUBLIC_API_URL is correct
- Check environment variables are set

### No news appearing
- Check RSS worker is running
- View Railway logs for worker
- Verify database connection
- Check Redis is working

### Tier check fails
- Verify WHOP_API_KEY is correct
- Check WHOP_PREMIUM_ACCESS_PASS_ID matches
- Test with known Premium user

---

**You're ready to deploy!** 🚀

Follow each phase in order, test thoroughly, and you'll be live soon!
