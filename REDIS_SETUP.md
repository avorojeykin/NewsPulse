# Redis Configuration for Railway Deployment

## Problem
Backend was trying to connect to `localhost:6379` instead of Upstash Redis in production.

## Solution
Updated [backend/src/config/redis.ts](backend/src/config/redis.ts) to support both:
- **Production**: `REDIS_URL` (full connection string from Upstash)
- **Local**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (separate env vars)

## Railway Environment Variables Required

Set these in your Railway backend service:

### From Upstash Redis Dashboard:
```bash
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6380
```

**Where to find this:**
1. Go to https://console.upstash.com/
2. Click your Redis database
3. Copy the **Redis URL** (looks like: `rediss://default:abc123@fly-abc-123.upstash.io:6380`)
4. Add to Railway as `REDIS_URL`

### Test Locally
For local testing with Docker:
```bash
# .env.local
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD= (leave empty for local)
```

## Expected Logs
After deploying, you should see:
```
📡 Connecting to Redis: your-host.upstash.io:6380
✅ Redis connected
```

Instead of:
```
Error: connect ECONNREFUSED 127.0.0.1:6379  ❌
```

## RSS Feed Failures (Expected)
Some feeds will fail with 403/404 - this is normal:
- **403 (Forbidden)**: Feed blocks automated access
- **404 (Not Found)**: Feed URL changed or removed
- **Invalid XML**: Feed has issues

These failures are handled gracefully and won't crash the app.
