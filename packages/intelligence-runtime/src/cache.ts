import type { IntelligenceDomain, RuntimeScope } from './runtime.js';

export type CacheLayer = 'overview' | 'detail' | 'retrieval' | 'agent_context';

export interface CacheAddress {
  domain: IntelligenceDomain;
  layer: CacheLayer;
  scope: RuntimeScope;
  entityId?: string;
  locale?: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: string;
  expiresAt: string;
  tags: string[];
}

export interface CachePort {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(entry: CacheEntry<T>): Promise<void>;
  invalidateByTag(tag: string): Promise<number>;
}

export function buildCacheKey(address: CacheAddress): string {
  const scope = [
    address.scope.customerId,
    address.scope.marketId,
    address.scope.propertyId,
    address.scope.venueId,
  ].filter(Boolean).join(':') || 'global';
  return [
    'stelthion',
    address.domain,
    address.layer,
    scope,
    address.entityId ?? 'index',
    address.locale ?? address.scope.locale ?? 'default',
  ].join(':');
}

export function cacheTags(address: CacheAddress): string[] {
  return [
    `${address.domain}:${address.layer}`,
    address.scope.customerId ? `customer:${address.scope.customerId}` : null,
    address.scope.marketId ? `market:${address.scope.marketId}` : null,
    address.scope.propertyId ? `property:${address.scope.propertyId}` : null,
    address.scope.venueId ? `venue:${address.scope.venueId}` : null,
  ].filter((tag): tag is string => Boolean(tag));
}
