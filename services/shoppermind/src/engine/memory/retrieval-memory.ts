import {
  DEFAULT_MATERIALIZATION_POLICY,
  createMaterializedInsight,
  refreshMaterializedFreshness,
  retentionTtlSeconds,
  type MaterializedInsight,
} from '@stelthion/intelligence-runtime';
import type { CorpusDocument } from '../insights/phenomenon-corpus.js';
import { buildCorpusForMarket } from '../insights/phenomenon-corpus.js';
import { marketCachePattern, retrievalCorpusCacheKey } from './cache-keys.js';
import { materializeMarketOverview } from './market-overview-memory.js';
import { deleteByPattern, readJson, writeJson } from './redis-cache.js';

type RetrievalValue = Omit<RetrievalMemorySnapshot, 'materializedAt' | 'expiresAt' | 'freshness'>;
type PlatformRetrieval = MaterializedInsight<RetrievalValue>;

export interface RetrievalMemorySnapshot {
  marketId: string;
  windowDays: number;
  materializedAt: string;
  expiresAt: string;
  freshness: 'fresh' | 'stale';
  documents: CorpusDocument[];
}

export async function readMarketRetrievalCorpus(
  marketId: string,
  windowDays: number,
  now = new Date(),
): Promise<RetrievalMemorySnapshot | null> {
  const snapshot = await readJson<PlatformRetrieval>(
    retrievalCorpusCacheKey(marketId, windowDays),
  );
  if (!snapshot) return null;
  return flatten(refreshMaterializedFreshness(snapshot, now));
}

export async function materializeMarketRetrievalCorpus(
  marketId: string,
  windowDays: number,
  now = new Date(),
): Promise<RetrievalMemorySnapshot> {
  const documents = await buildCorpusForMarket(marketId, windowDays);
  const snapshot = createMaterializedInsight({
    domain: 'shoppermind',
    kind: 'retrieval',
    scope: { marketId },
    policy: DEFAULT_MATERIALIZATION_POLICY,
    now,
    value: { marketId, windowDays, documents },
  });
  await writeJson(
    retrievalCorpusCacheKey(marketId, windowDays),
    snapshot,
    retentionTtlSeconds(DEFAULT_MATERIALIZATION_POLICY),
  );
  return flatten(snapshot);
}

export async function refreshMarketMemoryCaches(marketId: string): Promise<void> {
  await deleteByPattern(marketCachePattern(marketId));
  await Promise.all([
    materializeMarketOverview(marketId),
    materializeMarketRetrievalCorpus(marketId, 30),
  ]);
}

function flatten(snapshot: PlatformRetrieval): RetrievalMemorySnapshot {
  return {
    ...snapshot.value,
    materializedAt: snapshot.materializedAt,
    expiresAt: snapshot.expiresAt,
    freshness: snapshot.freshness,
  };
}
