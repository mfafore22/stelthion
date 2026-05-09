import { prisma } from '../../db/prisma.js';
import { refreshMarketMemoryCaches } from '../memory/retrieval-memory.js';
import type { MarketConfig } from '../registry/market-schema.js';
import { listMarkets, loadMarket } from '../registry/market-registry.js';
import { buildSignalOfTheDayCopy } from './signal-of-the-day-copy.js';

export interface MaterializeSignalOfTheDayOptions {
  date?: Date | string;
  marketIds?: string[];
  refreshCaches?: boolean;
}

export interface SignalOfTheDayMarketResult {
  marketId: string;
  status: 'materialized' | 'skipped';
  signalOfTheDayId?: string;
  phenomenonId?: string;
  scoreDate?: string;
  reason?: string;
}

export interface SignalOfTheDayMaterializationSummary {
  date: string;
  processed: number;
  materialized: number;
  skipped: number;
  results: SignalOfTheDayMarketResult[];
}

type ScoreRow = {
  phenomenonId: string;
  country: string;
  date: Date;
  compositeScore: number;
  phenomenon: {
    id: string;
    label: string;
    description: string;
    i18n?: unknown;
  };
};

export async function materializeSignalOfTheDay(
  options: MaterializeSignalOfTheDayOptions = {},
): Promise<SignalOfTheDayMaterializationSummary> {
  const date = day(options.date ?? new Date());
  const markets = await resolveMarkets(options.marketIds);
  const results: SignalOfTheDayMarketResult[] = [];
  for (const market of markets) {
    results.push(await materializeMarketSignal(market, date, options.refreshCaches !== false));
  }
  return {
    date: isoDay(date),
    processed: results.length,
    materialized: results.filter((r) => r.status === 'materialized').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    results,
  };
}

async function materializeMarketSignal(
  market: MarketConfig,
  targetDate: Date,
  refreshCaches: boolean,
): Promise<SignalOfTheDayMarketResult> {
  const score = await topScore(market.id, targetDate);
  if (!score) return { marketId: market.id, status: 'skipped', reason: 'no_scores' };
  const copy = buildSignalOfTheDayCopy({
    date: targetDate,
    marketName: market.displayName,
    phenomenon: score.phenomenon,
    compositeScore: score.compositeScore,
    scoreDate: score.date,
  });
  const sot = await prisma().signalOfTheDay.upsert({
    where: { marketId_date: { marketId: market.id, date: targetDate } },
    create: {
      marketId: market.id,
      country: score.country || market.country,
      date: targetDate,
      phenomenonIds: [score.phenomenonId],
      narrative: copy.narrative,
      i18n: copy.i18n,
    },
    update: {
      country: score.country || market.country,
      phenomenonIds: { set: [score.phenomenonId] },
      narrative: copy.narrative,
      i18n: copy.i18n,
    },
  });
  if (refreshCaches) await refreshMarketMemoryCaches(market.id);
  return {
    marketId: market.id,
    status: 'materialized',
    signalOfTheDayId: sot.id,
    phenomenonId: score.phenomenonId,
    scoreDate: isoDay(score.date),
  };
}

async function topScore(marketId: string, date: Date): Promise<ScoreRow | null> {
  return prisma().phenomenonScore.findFirst({
    where: { marketId, date: { lte: date } },
    orderBy: [{ date: 'desc' }, { compositeScore: 'desc' }],
    include: { phenomenon: true },
  }) as Promise<ScoreRow | null>;
}

async function resolveMarkets(marketIds?: string[]): Promise<MarketConfig[]> {
  if (!marketIds?.length) return listMarkets();
  const markets = await Promise.all(marketIds.map((id) => loadMarket(id)));
  return markets.filter((market): market is MarketConfig => Boolean(market?.active));
}

function day(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00.000Z`) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
