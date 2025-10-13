import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import { LRUCache } from '../utils/lruCache.js';

dotenv.config();

// In-memory LRU cache to reduce Redis calls
// Reduced to 500 entries to prevent OOM on Railway free tier
// Still maintains ~80-90% hit rate
const hashCache = new LRUCache<string, boolean>(500);

// Cache performance metrics
let cacheHits = 0;
let cacheMisses = 0;
let redisQueries = 0;

// Support both REDIS_URL (Upstash/Railway) and separate env vars (local)
let redisUrl: string;
let REDIS_HOST: string;
let REDIS_PORT: string;
let REDIS_PASSWORD: string | undefined;

if (process.env.REDIS_URL) {
  // Use REDIS_URL if provided (Upstash format)
  redisUrl = process.env.REDIS_URL;

  // Parse URL for BullMQ config
  try {
    const url = new URL(redisUrl);
    REDIS_HOST = url.hostname;
    REDIS_PORT = url.port || (redisUrl.startsWith('rediss://') ? '6380' : '6379');
    REDIS_PASSWORD = url.password || undefined;
  } catch (error) {
    console.error('Failed to parse REDIS_URL:', error);
    REDIS_HOST = 'localhost';
    REDIS_PORT = '6379';
    REDIS_PASSWORD = undefined;
  }
} else {
  // Build from separate env vars (local development)
  REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  REDIS_PORT = process.env.REDIS_PORT || '6379';
  REDIS_PASSWORD = process.env.REDIS_PASSWORD;

  redisUrl = REDIS_PASSWORD
    ? `rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
    : `redis://${REDIS_HOST}:${REDIS_PORT}`;
}

console.log(`📡 Connecting to Redis: ${REDIS_HOST}:${REDIS_PORT}`);

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://'),
    rejectUnauthorized: false
  }
});

// BullMQ-compatible connection config
export const redisConnection = {
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT),
  ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
  ...(redisUrl.startsWith('rediss://') && { tls: { rejectUnauthorized: false } }),
};

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  // Only connect if not already connected
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } else {
    console.log('✅ Redis already connected');
  }
}

export async function checkDuplicate(hash: string): Promise<boolean> {
  // Check in-memory cache first (fast path)
  if (hashCache.has(hash)) {
    cacheHits++;
    return hashCache.get(hash) || false;
  }

  // Cache miss - check Redis (slow path)
  cacheMisses++;
  redisQueries++;
  const exists = await redisClient.exists(`news:${hash}`);
  const isDuplicate = exists === 1;

  // Store in cache for future checks
  hashCache.set(hash, isDuplicate);

  return isDuplicate;
}

export async function markAsProcessed(hash: string): Promise<void> {
  // Mark in Redis with 24-hour TTL
  redisQueries++;
  await redisClient.setEx(`news:${hash}`, 86400, '1');

  // Also cache in memory
  hashCache.set(hash, true);
}

// Helper to get cache stats for monitoring
export function getCacheStats() {
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : '0.0';

  return {
    size: hashCache.size(),
    maxSize: 500,
    cacheHits,
    cacheMisses,
    totalRequests,
    hitRate: `${hitRate}%`,
    redisQueries,
    redisSaved: cacheHits, // Redis queries saved by cache
  };
}

// Reset cache metrics (useful for testing)
export function resetCacheMetrics() {
  cacheHits = 0;
  cacheMisses = 0;
  redisQueries = 0;
}
