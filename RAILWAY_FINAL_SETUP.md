# Railway Backend - Final Environment Variables

## All Required Variables

Set these in your Railway backend service:

### 1. Database (Already Set ✅)
```bash
DATABASE_URL=postgresql://...
```

### 2. Redis (Update This)
```bash
REDIS_URL=rediss://default:AU_OAAIncDJlYjE4Yjc4OTJmNDg0NzA0YWRkMWExN2U5MmM2YWYxZnAyMjA0MzA@happy-mustang-20430.upstash.io:6379
```

### 3. Whop API (Already Set ✅)
```bash
WHOP_API_KEY=your_key_here
```

### 4. Whop App ID (ADD THIS ❌)
```bash
WHOP_APP_ID=app_YOUR_APP_ID
```
**How to find:**
- Go to https://whop.com/apps
- Click your NewsPulse app
- Look in the URL: `whop.com/apps/app_XXXXX`
- Copy the `app_XXXXX` part

### 5. Premium Access Pass ID (ADD THIS ❌)
```bash
WHOP_PREMIUM_ACCESS_PASS_ID=plan_nox6lp5V6fd2A
```
(This is your Premium plan ID from the upgrade button: `plan_nox6lp5V6fd2A`)

### 6. Port (Already Set ✅)
```bash
PORT=3001
```

## Quick Setup Checklist

- [ ] Update `REDIS_URL` to the `rediss://` version above
- [ ] Add `WHOP_APP_ID` from your Whop dashboard
- [ ] Add `WHOP_PREMIUM_ACCESS_PASS_ID=plan_nox6lp5V6fd2A`
- [ ] Redeploy backend in Railway

## Expected Logs After Fix

```
📡 Connecting to Redis: happy-mustang-20430.upstash.io:6379
✅ Redis connected
✅ Database connected
🚀 Backend server running on http://localhost:3001
📡 Health check: http://localhost:3001/health
📰 News API: http://localhost:3001/api/news

🔧 Starting background workers...
🚀 Starting RSS Worker...
✅ Redis already connected
📡 RSS Worker running - polling every 60 seconds
🚀 Starting News Processor Worker...
✅ Redis already connected
📡 News Processor Worker running - waiting for jobs...
✅ All workers started successfully
```

## No More Errors Like:
```
❌ Error: connect ECONNREFUSED 127.0.0.1:6379
❌ Redis Client Error SocketClosedUnexpectedlyError
```
