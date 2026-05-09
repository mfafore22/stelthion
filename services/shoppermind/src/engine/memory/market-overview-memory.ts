import {
  DEFAULT_MATERIALIZATION_POLICY,
  createMaterializedInsight,
  refreshMaterializedFreshness,
  retentionTtlSeconds,
  type MaterializedInsight,
} from '@stelthion/intelligence-runtime';
import { prisma } from '../../db/prisma.js';
import { loadMarket } from '../registry/market-registry.js';
import { marketOverviewCacheKey } from './cache-keys.js';
import {
  attachRecentScores,
  dateSafe,
  pickLatestPhenomena,
  publicMarket,
} from './market-overview-shape.js';
import { readJson, writeJson } from './redis-cache.js';

type Freshness = 'fresh' | 'stale';
type OverviewValue = Omit<MarketOverviewSnapshot, 'materializedAt' | 'expiresAt' | 'freshness'>;
type PlatformOverview = MaterializedInsight<OverviewValue>;

export interface MarketOverviewSnapshot {
  marketId: string;
  materializedAt: string;
  expiresAt: string;
  freshness: Freshness;
  market: Record<string, unknown> | null;
  phenomena: Array<Record<string, unknown>>;
  signalOfTheDay: Record<string, unknown> | null;
}

export async function getMarketOverview(
  marketId: string,
  limit = 25,
  now = new Date(),
): Promise<MarketOverviewSnapshot> {
  const cached = await readJson<PlatformOverview>(marketOverviewCacheKey(marketId));
  if (cached) return flatten(refreshMaterializedFreshness(cached, now));
  return materializeMarketOverview(marketId, limit, now);
}

export async function materializeMarketOverview(
  marketId: string,
  limit = 25,
  now = new Date(),
): Promise<MarketOverviewSnapshot> {
  const db = prisma();
  const [market, scores, signal] = await Promise.all([
    loadMarket(marketId),
    db.phenomenonScore.findMany({
      where: { marketId },
      orderBy: [{ date: 'desc' }, { compositeScore: 'desc' }],
      take: limit * 3,
      include: { phenomenon: true },
    }),
    db.signalOfTheDay.findFirst({ where: { marketId }, orderBy: { date: 'desc' } }),
  ]);
  const phenomena = await pickLatestPhenomena(scores, limit, marketId);
  await attachRecentScores(phenomena, marketId);
  const insight = createMaterializedInsight({
    domain: 'shoppermind',
    kind: 'overview',
    scope: { marketId },
    policy: DEFAULT_MATERIALIZATION_POLICY,
    now,
    value: {
      marketId,
      market: market ? publicMarket(market) : null,
      phenomena,
      signalOfTheDay: signal ? dateSafe(signal) : null,
    },
  });
  await writeJson(
    marketOverviewCacheKey(marketId),
    insight,
    retentionTtlSeconds(DEFAULT_MATERIALIZATION_POLICY),
  );
  return flatten(insight);
}

function flatten(insight: PlatformOverview): MarketOverviewSnapshot {
  return {
    ...insight.value,
    materializedAt: insight.materializedAt,
    expiresAt: insight.expiresAt,
    freshness: insight.freshness,
  };
}
