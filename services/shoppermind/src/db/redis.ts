import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let cached: Redis | null = null;

export function redis(): Redis {
  if (cached) return cached;
  const instance = new Redis(env().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  cached = instance;
  return instance;
}

export async function disconnectRedis(): Promise<void> {
  if (cached) {
    await cached.quit();
    cached = null;
  }
}
