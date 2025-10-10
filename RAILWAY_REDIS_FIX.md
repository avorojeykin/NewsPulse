# Fix Railway Backend Redis Connection

## Problem
Backend logs show:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

This means `REDIS_URL` environment variable is **NOT SET** in Railway.

## Solution - Set REDIS_URL in Railway Dashboard

### Step 1: Get Your Upstash Redis URL

1. Go to https://console.upstash.com/
2. Click on your Redis database
3. Look for **"Redis URL"** or **"Endpoint"**
4. Copy the full URL (should look like):
   ```
   rediss://default:YOUR_PASSWORD_HERE@fly-abc-12345.upstash.io:6380
   ```

### Step 2: Set in Railway

**Option A: Railway Dashboard (Recommended)**
1. Go to https://railway.app/
2. Open your `newspulse-backend` service
3. Click **"Variables"** tab
4. Click **"+ New Variable"**
5. Enter:
   - **Name**: `REDIS_URL`
   - **Value**: Paste your full Redis URL from Step 1
6. Click **"Add"**
7. Railway will automatically redeploy

**Option B: Railway CLI**
```bash
cd backend
railway service
# Select: newspulse-backend
railway variables set REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6380"
```

### Step 3: Verify Deployment

After Railway redeploys, check the logs. You should see:
```
📡 Connecting to Redis: fly-abc-12345.upstash.io:6380
✅ Redis connected
✅ Database connected
🚀 Backend server running...
```

**NOT:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379  ❌ BAD
```

## Why This Happens

The backend code checks for `REDIS_URL` first:
```typescript
if (process.env.REDIS_URL) {
  // Use Upstash Redis
} else {
  // Falls back to localhost ❌
}
```

Without `REDIS_URL` set, it defaults to `localhost:6379` which doesn't exist in Railway.

## Quick Check

Run this command to verify the variable is set:
```bash
cd backend
railway variables
```

You should see `REDIS_URL` in the list.
