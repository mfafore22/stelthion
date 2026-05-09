import { redis } from '../../db/redis.js';

const KEY = 'shoppermind:metrics:cache';
let hits = 0;
let misses = 0;

export async function recordCacheAccess(kind: 'hit' | 'miss'): Promise<void> {
  if (kind === 'hit') hits++;
  else misses++;
  if (process.env.NODE_ENV === 'test') return;
  await redis().hincrby(KEY, kind === 'hit' ? 'hits' : 'misses', 1).catch(() => {});
}

export async function cacheMetricsSnapshot() {
  if (process.env.NODE_ENV !== 'test') {
    const remote = await redis().hgetall(KEY).catch(() => null);
    if (remote) return build(Number(remote.hits ?? 0), Number(remote.misses ?? 0), 'redis');
  }
  return build(hits, misses, 'memory');
}

export async function resetCacheMetricsForTests(): Promise<void> {
  hits = 0;
  misses = 0;
}

function build(h: number, m: number, source: 'redis' | 'memory') {
  const total = h + m;
  return {
    source,
    hits: h,
    misses: m,
    hitRate: total > 0 ? h / total : null,
  };
}
