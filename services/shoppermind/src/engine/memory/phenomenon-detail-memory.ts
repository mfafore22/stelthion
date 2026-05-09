import {
  DEFAULT_MATERIALIZATION_POLICY,
  createMaterializedInsight,
  refreshMaterializedFreshness,
  retentionTtlSeconds,
  type MaterializedInsight,
} from '@stelthion/intelligence-runtime';
import { prisma } from '../../db/prisma.js';
import { qualityViewFromScore } from '../quality/envelope.js';
import { loadPhenomenonSourceEvidence } from '../quality/source-evidence.js';
import { phenomenonDetailCacheKey } from './cache-keys.js';
import { dateSafe } from './market-overview-shape.js';
import { readJson, writeJson } from './redis-cache.js';

type DetailValue = Omit<PhenomenonDetailSnapshot, 'materializedAt' | 'expiresAt' | 'freshness'>;
type PlatformDetail = MaterializedInsight<DetailValue>;

export interface PhenomenonDetailSnapshot {
  marketId: string;
  phenomenonId: string;
  materializedAt: string;
  expiresAt: string;
  freshness: 'fresh' | 'stale';
  phenomenon: Record<string, unknown>;
}

export async function getPhenomenonDetailSnapshot(
  marketId: string,
  phenomenonId: string,
  now = new Date(),
): Promise<PhenomenonDetailSnapshot | null> {
  const cached = await readJson<PlatformDetail>(
    phenomenonDetailCacheKey(marketId, phenomenonId),
  );
  if (cached) return flatten(refreshMaterializedFreshness(cached, now));
  return materializePhenomenonDetail(marketId, phenomenonId, now);
}

export async function materializePhenomenonDetail(
  marketId: string,
  phenomenonId: string,
  now = new Date(),
): Promise<PhenomenonDetailSnapshot | null> {
  const phenomenon = await prisma().phenomenon.findUnique({
    where: { id: phenomenonId },
    include: {
      scores: { where: { marketId }, orderBy: { date: 'desc' }, take: 30 },
      linksFrom: true,
      linksTo: true,
    },
  });
  if (!phenomenon) return null;
  const latest = phenomenon.scores[0] ?? null;
  const evidence = latest ? await loadPhenomenonSourceEvidence(phenomenonId, marketId) : undefined;
  const value = {
    marketId,
    phenomenonId,
    phenomenon: {
      ...dateSafe(phenomenon),
      qualityView: latest ? qualityViewFromScore({ ...latest, phenomenon }, evidence) : null,
    },
  };

  const snapshot = createMaterializedInsight({
    domain: 'shoppermind',
    kind: 'detail',
    scope: { marketId },
    entityId: phenomenonId,
    policy: DEFAULT_MATERIALIZATION_POLICY,
    now,
    value,
  });
  await writeJson(
    phenomenonDetailCacheKey(marketId, phenomenonId),
    snapshot,
    retentionTtlSeconds(DEFAULT_MATERIALIZATION_POLICY),
  );
  return flatten(snapshot);
}

function flatten(snapshot: PlatformDetail): PhenomenonDetailSnapshot {
  return {
    ...snapshot.value,
    materializedAt: snapshot.materializedAt,
    expiresAt: snapshot.expiresAt,
    freshness: snapshot.freshness,
  };
}
