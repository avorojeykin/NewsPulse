# X (Twitter) API Integration Guide (Phase 2)

## Overview

Integrate X (Twitter) API v2 for real-time news monitoring from key accounts in crypto, stocks, and sports betting.

**Goal**: Add 1 X account feed per community (Free tier) and up to 10 accounts (Premium tier).

---

## Prerequisites

### 1. X Developer Account Setup

1. **Apply for Developer Access**: https://developer.x.com/en/portal/petition/essential/basic-info
   - Account type: **Hobbyist** (free) or **Elevated** ($100/mo for more volume)
   - Use case: "News aggregation for community platform"
   - Expected monthly tweet volume: <500,000 (free tier)

2. **Create Project & App**:
   - Project name: "NewsPulse"
   - App name: "NewsPulse-Production"
   - Get credentials:
     - API Key
     - API Secret Key
     - Bearer Token ← **This is what we need**

3. **Enable OAuth 2.0** (if needed for user auth later):
   - Callback URL: `https://newspulse.com/api/auth/callback`
   - Website URL: `https://newspulse.com`

### 2. Environment Variables

Add to `backend/.env`:
```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install twitter-api-v2
```

### Step 2: Create X Service

**File**: `backend/src/services/xService.ts`

```typescript
import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';

dotenv.config();

export const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '');

export interface XFeed {
  accountUsername: string; // e.g., "VitalikButerin"
  category: 'crypto' | 'stocks' | 'sports';
  experienceId: string; // Whop experience ID
}

// Get user ID from username
export async function getUserId(username: string): Promise<string> {
  const user = await twitterClient.v2.userByUsername(username);
  return user.data.id;
}

// Setup filtered stream rule
export async function addStreamRule(username: string, tag: string) {
  const rules = await twitterClient.v2.streamRules();

  // Delete old rules for this tag
  if (rules.data?.length) {
    const oldRules = rules.data.filter(rule => rule.tag === tag);
    if (oldRules.length) {
      await twitterClient.v2.updateStreamRules({
        delete: { ids: oldRules.map(r => r.id) },
      });
    }
  }

  // Add new rule
  await twitterClient.v2.updateStreamRules({
    add: [{ value: `from:${username}`, tag }],
  });
}

// Remove stream rule
export async function removeStreamRule(tag: string) {
  const rules = await twitterClient.v2.streamRules();
  const ruleToDelete = rules.data?.find(rule => rule.tag === tag);

  if (ruleToDelete) {
    await twitterClient.v2.updateStreamRules({
      delete: { ids: [ruleToDelete.id] },
    });
  }
}

// Start filtered stream
export async function startFilteredStream(
  onTweet: (tweet: any, category: string) => Promise<void>
) {
  const stream = await twitterClient.v2.searchStream({
    'tweet.fields': ['created_at', 'text', 'author_id'],
    'user.fields': ['username', 'name'],
    expansions: ['author_id'],
  });

  stream.on('data', async (data) => {
    const tweet = data.data;
    const author = data.includes?.users?.[0];
    const rule = data.matching_rules?.[0];
    const category = rule?.tag || 'crypto'; // tag is the category

    await onTweet({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      author_username: author?.username,
      author_name: author?.name,
    }, category);
  });

  stream.on('error', (error) => {
    console.error('❌ X Stream Error:', error);
    // Implement reconnection logic
  });

  console.log('✅ X filtered stream started');
}
```

### Step 3: Create X Worker

**File**: `backend/src/workers/x.worker.ts`

```typescript
import { startFilteredStream } from '../services/xService';
import { Queue } from 'bullmq';
import { generateHash } from '../services/newsProcessor';

const newsQueue = new Queue('news-processing', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

export async function startXWorker() {
  console.log('🚀 Starting X (Twitter) Worker...');

  await startFilteredStream(async (tweet, category) => {
    console.log(`📱 New tweet from @${tweet.author_username} (${category})`);

    const newsItem = {
      source: `X/@${tweet.author_username}`,
      vertical: category,
      title: tweet.text.substring(0, 100), // First 100 chars as title
      content: tweet.text,
      url: `https://twitter.com/${tweet.author_username}/status/${tweet.id}`,
      publishedAt: new Date(tweet.created_at),
      hash: generateHash(tweet.text, tweet.id),
    };

    // Queue for processing (no delay for X tweets - real-time!)
    await newsQueue.add('process-news', newsItem, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  });
}

// Run if executed directly
if (require.main === module) {
  startXWorker().catch(console.error);
}
```

### Step 4: Database Schema for X Feeds

Already exists in `database/schema.sql`:
```sql
CREATE TABLE x_feeds (
    id SERIAL PRIMARY KEY,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    handle VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- crypto, stocks, sports
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experience_id, handle)
);
```

### Step 5: API Endpoints for X Feed Management

**File**: `backend/src/index.ts` (add these routes)

```typescript
// Get X feeds for an experience
app.get('/api/x-feeds/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const feeds = await query<any>(
      'SELECT * FROM x_feeds WHERE experience_id = $1 AND active = true',
      [experienceId]
    );
    res.json({ feeds });
  } catch (error) {
    console.error('Error fetching X feeds:', error);
    res.status(500).json({ error: 'Failed to fetch X feeds' });
  }
});

// Add X feed
app.post('/api/x-feeds', async (req, res) => {
  try {
    const { experienceId, handle, category } = req.body;

    // Check tier limits
    const existingFeeds = await query<any>(
      'SELECT COUNT(*) FROM x_feeds WHERE experience_id = $1 AND active = true',
      [experienceId]
    );

    const feedCount = parseInt(existingFeeds[0].count);
    // TODO: Check user tier from Whop SDK
    // Free: 1 feed, Premium: 10 feeds
    if (feedCount >= 1) {
      return res.status(403).json({ error: 'Feed limit reached for your tier' });
    }

    // Add to database
    await query(
      'INSERT INTO x_feeds (experience_id, handle, category, active) VALUES ($1, $2, $3, true)',
      [experienceId, handle, category]
    );

    // Add to X stream
    await addStreamRule(handle, category);

    res.json({ success: true, message: `Added @${handle} to ${category} feed` });
  } catch (error) {
    console.error('Error adding X feed:', error);
    res.status(500).json({ error: 'Failed to add X feed' });
  }
});

// Remove X feed
app.delete('/api/x-feeds/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const feed = await query<any>('SELECT * FROM x_feeds WHERE id = $1', [id]);
    if (!feed.length) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    // Remove from database
    await query('UPDATE x_feeds SET active = false WHERE id = $1', [id]);

    // Remove from X stream
    await removeStreamRule(feed[0].category);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing X feed:', error);
    res.status(500).json({ error: 'Failed to remove X feed' });
  }
});
```

### Step 6: Frontend UI for X Feed Management

**File**: `frontend/components/XFeedManager.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function XFeedManager({ experienceId }: { experienceId: string }) {
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState<'crypto' | 'stocks' | 'sports'>('crypto');

  const addFeed = async () => {
    const response = await fetch('/api/x-feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experienceId, handle, category }),
    });

    if (response.ok) {
      alert(`Added @${handle} to ${category} feed!`);
      setHandle('');
    } else {
      const data = await response.json();
      alert(data.error);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">📱 X (Twitter) Feed</h3>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Username (e.g., VitalikButerin)"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-700 rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="px-4 py-2 bg-slate-700 rounded"
        >
          <option value="crypto">Crypto</option>
          <option value="stocks">Stocks</option>
          <option value="sports">Sports</option>
        </select>

        <button
          onClick={addFeed}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
        >
          Add Feed
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-2">
        Free tier: 1 feed | Premium: 10 feeds
      </p>
    </div>
  );
}
```

---

## Recommended Accounts to Monitor

### Crypto
- **@VitalikButerin** - Ethereum creator
- **@cz_binance** - Binance CEO
- **@brian_armstrong** - Coinbase CEO
- **@SBF_FTX** - Crypto news (if active)
- **@CoinDesk** - News outlet
- **@Cointelegraph** - News outlet

### Stocks
- **@elonmusk** - Tesla CEO
- **@markets** - Bloomberg Markets
- **@WSJ** - Wall Street Journal
- **@CNBC** - CNBC News
- **@jimcramer** - Mad Money host

### Sports Betting
- **@ActionNetworkHQ** - Sports betting insights
- **@covers** - Betting news
- **@OddsChecker** - Odds analysis
- **@BR_Betting** - Bleacher Report betting

---

## Rate Limits & Costs

### Free Tier (Basic Access)
- **Stream connections**: 1 concurrent
- **Filtered stream rules**: 25 max
- **Tweet cap**: 500,000 tweets/month
- **Cost**: FREE

### Elevated Access
- **Cost**: $100/month
- **Tweet cap**: 2,000,000 tweets/month
- **Higher rate limits

**Recommendation**: Start with free tier, upgrade if needed.

---

## Testing

```bash
# Start X worker
cd backend
npm run worker:x

# Add a test rule (manually)
curl -X POST http://localhost:3001/api/x-feeds \
  -H "Content-Type: application/json" \
  -d '{
    "experienceId": "test-123",
    "handle": "VitalikButerin",
    "category": "crypto"
  }'

# Monitor logs for incoming tweets
# Should see: 📱 New tweet from @VitalikButerin (crypto)
```

---

## Error Handling

### Reconnection Logic

```typescript
let reconnectAttempts = 0;
const MAX_RECONNECTS = 5;

stream.on('error', async (error) => {
  console.error('❌ X Stream Error:', error);

  if (reconnectAttempts < MAX_RECONNECTS) {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

    console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts})`);
    await new Promise(resolve => setTimeout(resolve, delay));

    startFilteredStream(onTweet);
  } else {
    console.error('❌ Max reconnection attempts reached');
    // Send alert to admin
  }
});

stream.on('connected', () => {
  reconnectAttempts = 0;
  console.log('✅ X stream connected');
});
```

---

## Production Deployment

1. **Add environment variable** to Railway:
   ```
   TWITTER_BEARER_TOKEN=your_token_here
   ```

2. **Start X worker** alongside RSS worker:
   ```bash
   npm run worker:x
   ```

3. **Monitor logs** for stream health

4. **Setup alerting** for disconnections

---

## Next Steps

1. ✅ Get X Developer Account
2. ✅ Implement filtered stream
3. ✅ Add feed management UI
4. ✅ Test with real accounts
5. ✅ Deploy to production
6. Monitor and optimize

---

**Last Updated**: 2025-10-05
