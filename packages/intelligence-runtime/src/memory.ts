import type { IntelligenceDomain, RuntimeScope } from './runtime.js';

export type MemoryTier =
  | 'fresh_signal'
  | 'background_context'
  | 'verified_evidence'
  | 'retrieval'
  | 'ui_cache';

export type MemorySensitivity =
  | 'public'
  | 'customer_scoped'
  | 'operator_review'
  | 'restricted';

export interface MemoryDocument {
  id: string;
  domain: IntelligenceDomain;
  tier: MemoryTier;
  scope: RuntimeScope;
  title: string;
  body: string;
  sourceIds: string[];
  entityIds: string[];
  freshnessAt: string;
  expiresAt?: string;
  sensitivity: MemorySensitivity;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  domain: IntelligenceDomain;
  tier?: MemoryTier;
  scope: RuntimeScope;
  query?: string;
  limit?: number;
}

export interface MemoryPort {
  upsert(document: MemoryDocument): Promise<void>;
  search(query: MemoryQuery): Promise<MemoryDocument[]>;
  deleteExpired(now: Date): Promise<number>;
}
