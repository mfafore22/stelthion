import type {
  RateLimitDecision,
  RateLimitPolicy,
  RateLimitStore,
} from '@stelthion/intelligence-runtime';

type RedisEvalClient = {
  eval(script: string, keyCount: number, key: string, windowMs: string): Promise<unknown>;
};

const SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]) end
local ttl = redis.call("PTTL", KEYS[1])
return { count, ttl }
`;

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly client: RedisEvalClient) {}

  async consume(
    key: string,
    policy: RateLimitPolicy,
    nowMs: number = Date.now(),
  ): Promise<RateLimitDecision> {
    const [countRaw, ttlRaw] = await this.evalWindow(key, policy.windowMs);
    const count = Number(countRaw);
    const ttl = Math.max(0, Number(ttlRaw));
    const resetAt = nowMs + ttl;
    const allowed = count <= policy.max;
    return {
      allowed,
      state: { count, resetAt },
      remaining: Math.max(0, policy.max - count),
      retryAfterSeconds: allowed ? undefined : Math.ceil(ttl / 1000),
    };
  }

  private async evalWindow(key: string, windowMs: number): Promise<[unknown, unknown]> {
    const result = await this.client.eval(SCRIPT, 1, key, String(windowMs));
    if (!Array.isArray(result) || result.length < 2) {
      throw new Error('Invalid Redis rate-limit response');
    }
    return [result[0], result[1]];
  }
}
