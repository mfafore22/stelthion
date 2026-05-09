import type { CacheLayer } from './cache.js';
import type { IntelligenceDomain, RuntimeScope } from './runtime.js';

export type MaterializedFreshness = 'fresh' | 'stale';

export interface MaterializationPolicy {
  freshTtlMs: number;
  retentionTtlMs: number;
}

export const DEFAULT_MATERIALIZATION_POLICY: MaterializationPolicy = {
  freshTtlMs: 6 * 60 * 60 * 1000,
  retentionTtlMs: 48 * 60 * 60 * 1000,
};

export interface MaterializedInsight<T> {
  domain: IntelligenceDomain;
  kind: CacheLayer;
  scope: RuntimeScope;
  entityId?: string;
  materializedAt: string;
  expiresAt: string;
  freshness: MaterializedFreshness;
  value: T;
  metadata?: Record<string, unknown>;
}

export interface MaterializedInsightInput<T> {
  domain: IntelligenceDomain;
  kind: CacheLayer;
  scope: RuntimeScope;
  value: T;
  entityId?: string;
  metadata?: Record<string, unknown>;
  policy?: MaterializationPolicy;
  now?: Date;
}

export function createMaterializedInsight<T>(
  input: MaterializedInsightInput<T>,
): MaterializedInsight<T> {
  const now = input.now ?? new Date();
  const policy = input.policy ?? DEFAULT_MATERIALIZATION_POLICY;
  return {
    domain: input.domain,
    kind: input.kind,
    scope: input.scope,
    entityId: input.entityId,
    materializedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + policy.freshTtlMs).toISOString(),
    freshness: 'fresh',
    value: input.value,
    metadata: input.metadata,
  };
}

export function refreshMaterializedFreshness<T>(
  insight: MaterializedInsight<T>,
  now = new Date(),
): MaterializedInsight<T> {
  return {
    ...insight,
    freshness: new Date(insight.expiresAt) > now ? 'fresh' : 'stale',
  };
}

export function retentionTtlSeconds(policy: MaterializationPolicy): number {
  return Math.ceil(policy.retentionTtlMs / 1000);
}
