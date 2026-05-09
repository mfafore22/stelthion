import { redis } from '../../db/redis.js';
import { recordCacheAccess } from '../observability/cache-metrics.js';

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await redis().get(key);
  await recordCacheAccess(raw ? 'hit' : 'miss');
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function writeJson<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  await redis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function deleteByPattern(pattern: string): Promise<number> {
  const client = redis();
  let cursor = '0';
  let deleted = 0;
  do {
    const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    if (keys.length > 0) {
      deleted += await client.del(...keys);
    }
  } while (cursor !== '0');
  return deleted;
}
