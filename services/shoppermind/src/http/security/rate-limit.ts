import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  InMemoryRateLimitStore,
  rateLimitKey,
  type RateLimitPolicy,
  type RateLimitStore,
  type RouteSecurityClass,
} from '@stelthion/intelligence-runtime';
import { env } from '../../config/env.js';
import { redis } from '../../db/redis.js';
import { RedisRateLimitStore } from './redis-rate-limit-store.js';

let store: RateLimitStore | null = null;

export async function rateLimitByRequest(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const routeClass = classifyRoute(req.url);
  const policy = policyFor(routeClass);
  const key = rateLimitKey(routeClass, principalFor(req));
  const decision = await rateLimitStore().consume(key, policy).catch(() => null);
  if (!decision) {
    reply.code(503).send({ error: 'rate_limit_unavailable', routeClass });
    return;
  }

  reply.header('X-RateLimit-Limit', policy.max);
  reply.header('X-RateLimit-Remaining', decision.remaining);
  reply.header('X-RateLimit-Reset', Math.ceil(decision.state.resetAt / 1000));

  if (!decision.allowed) {
    reply.header('Retry-After', decision.retryAfterSeconds ?? 60);
    reply.code(429).send({ error: 'rate_limited', routeClass });
    return;
  }
}

export function resetRateLimitsForTests(): void {
  store = null;
}

export function classifyRoute(url: string): RouteSecurityClass {
  // Keep this map visible in logs/metrics before adding many more route classes.
  const path = url.split('?')[0] ?? url;
  if (path.includes('/export')) return 'export';
  if (path.includes('/chat') || path.includes('/campaign-idea')) return 'agent';
  if (path.startsWith('/internal')) return 'internal';
  return 'public';
}

function policyFor(routeClass: RouteSecurityClass): RateLimitPolicy {
  const e = env();
  const max = {
    public: e.RATE_LIMIT_PUBLIC_PER_MINUTE,
    internal: e.RATE_LIMIT_INTERNAL_PER_MINUTE,
    agent: e.RATE_LIMIT_AGENT_PER_MINUTE,
    export: e.RATE_LIMIT_EXPORT_PER_MINUTE,
  }[routeClass];
  return { windowMs: 60_000, max };
}

function rateLimitStore(): RateLimitStore {
  if (store) return store;
  const e = env();
  const backend = e.RATE_LIMIT_STORE ?? (e.NODE_ENV === 'test' ? 'memory' : 'redis');
  if (backend === 'memory') {
    if (e.NODE_ENV === 'production') {
      throw new Error('RATE_LIMIT_STORE=memory is not allowed in production');
    }
    store = new InMemoryRateLimitStore();
    return store;
  }
  store = new RedisRateLimitStore(redis());
  return store;
}

function principalFor(req: FastifyRequest): string {
  const token = req.headers.authorization;
  if (typeof token === 'string' && token.trim()) {
    return createHash('sha256').update(token).digest('hex');
  }
  return req.ip;
}
