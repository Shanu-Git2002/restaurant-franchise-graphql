import Redis from 'ioredis';
import { config } from './index';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
} as const;

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache<T>(key: string, value: T, ttl = CACHE_TTL.MEDIUM): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function deleteCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
