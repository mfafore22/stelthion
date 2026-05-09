export type RouteSecurityClass = 'public' | 'internal' | 'agent' | 'export';

export interface RateLimitPolicy {
  windowMs: number;
  max: number;
}

export interface RateLimitState {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  state: RateLimitState;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy, nowMs?: number): Promise<RateLimitDecision>;
  clear?(): void | Promise<void>;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private states = new Map<string, RateLimitState>();

  async consume(
    key: string,
    policy: RateLimitPolicy,
    nowMs: number = Date.now(),
  ): Promise<RateLimitDecision> {
    const decision = evaluateRateLimit(this.states.get(key), policy, nowMs);
    this.states.set(key, decision.state);
    return decision;
  }

  clear(): void {
    this.states.clear();
  }
}

export function evaluateRateLimit(
  state: RateLimitState | undefined,
  policy: RateLimitPolicy,
  nowMs: number = Date.now(),
): RateLimitDecision {
  const active = !state || state.resetAt <= nowMs
    ? { count: 0, resetAt: nowMs + policy.windowMs }
    : state;
  const next = { count: active.count + 1, resetAt: active.resetAt };
  const allowed = next.count <= policy.max;
  return {
    allowed,
    state: next,
    remaining: Math.max(0, policy.max - next.count),
    retryAfterSeconds: allowed ? undefined : Math.ceil((next.resetAt - nowMs) / 1000),
  };
}

export function rateLimitKey(
  routeClass: RouteSecurityClass,
  principal: string,
): string {
  return `${routeClass}:${principal}`;
}
