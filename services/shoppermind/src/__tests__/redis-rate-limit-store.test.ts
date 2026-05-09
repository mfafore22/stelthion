import { describe, expect, it } from 'vitest';
import { RedisRateLimitStore } from '../http/security/redis-rate-limit-store.js';

class FakeRedis {
  private rows = new Map<string, { count: number; expiresAt: number }>();

  async eval(_script: string, _keyCount: number, key: string, windowMs: string) {
    const now = 1000;
    const existing = this.rows.get(key);
    const row = !existing || existing.expiresAt <= now
      ? { count: 0, expiresAt: now + Number(windowMs) }
      : existing;
    row.count += 1;
    this.rows.set(key, row);
    return [row.count, row.expiresAt - now];
  }
}

describe('RedisRateLimitStore', () => {
  it('returns distributed fixed-window decisions from Redis counters', async () => {
    const store = new RedisRateLimitStore(new FakeRedis());
    const policy = { windowMs: 60_000, max: 1 };

    const first = await store.consume('rate:agent:a', policy, 1000);
    const second = await store.consume('rate:agent:a', policy, 1000);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBe(60);
  });
});
