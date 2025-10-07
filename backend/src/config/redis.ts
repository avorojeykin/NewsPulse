import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// BullMQ-compatible connection config
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
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
