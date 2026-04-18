import IORedis, { type Redis } from 'ioredis';
import { env } from '../config/env.js';

let cached: Redis | null = null;

export function redis(): Redis {
  if (cached) return cached;
  cached = new IORedis(env().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return cached;
}

export async function disconnectRedis(): Promise<void> {
  if (cached) {
    await cached.quit();
    cached = null;
  }
}
