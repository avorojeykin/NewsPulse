import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

// Build Redis URL from separate env vars (for Upstash)
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const redisUrl = REDIS_PASSWORD
  ? `rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
  : `redis://${REDIS_HOST}:${REDIS_PORT}`;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: REDIS_PASSWORD ? true : false,
    rejectUnauthorized: false
  }
});

// BullMQ-compatible connection config
export const redisConnection = {
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT),
  ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
  ...(REDIS_PASSWORD && { tls: { rejectUnauthorized: false } }),
};

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  await redisClient.connect();
  console.log('✅ Redis connected');
}

export async function checkDuplicate(hash: string): Promise<boolean> {
  const exists = await redisClient.exists(`news:${hash}`);
  return exists === 1;
}

export async function markAsProcessed(hash: string): Promise<void> {
  // 24-hour TTL for deduplication
  await redisClient.setEx(`news:${hash}`, 86400, '1');
}
