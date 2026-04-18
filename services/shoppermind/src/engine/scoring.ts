import type { PhenomenonState } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { movingAverage, medianAbsoluteDeviation, normalise } from './lib/stats.js';
import { getWeights, type Weights } from './weights.js';
import { loadMarket } from './registry/market-registry.js';

const DORMANT_THRESHOLD = 2;
const STABLE_THRESHOLD = 0.5;
const LOOKBACK_DAYS = 28;

export interface ScoreSummary {
  marketId: string;
  phenomenaScored: number;
  stateChanges: number;
  durationMs: number;
}

interface DailyVolumePoint {
  date: Date;
  volume: number;
  sources: number;
}

/**
 * Phase 1: scores each phenomenon in the market's country with the legacy
 * single-axis pipeline, then writes identical values into footTrafficScore
 * and culturalScore with proximity 1.0 on both axes and linkBoost 0. With the
 * default market axis weights 0.5/0.5, the new composite = 0.5×legacy + 0.5×
 * legacy = legacy — bit-identical to pre-migration values, the invariant the
 * import-script regression harness asserts. Phase 2 replaces this with true
 * dual-axis scoring via the locality resolver + proximity weights.
 */
export async function runScoring(marketId: string): Promise<ScoreSummary> {
  const start = Date.now();
  const db = prisma();
  const market = await loadMarket(marketId);
  if (!market) {
    return { marketId, phenomenaScored: 0, stateChanges: 0, durationMs: 0 };
  }
  const phenomena = await db.phenomenon.findMany({
    where: { mergedInto: null, primaryCountry: market.country },
    select: { id: true, primaryCountry: true, state: true },
  });

  const weights = await getWeights(marketId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let phenomenaScored = 0;
  let stateChanges = 0;

  for (const p of phenomena) {
    const series = await buildDailySeries(p.id, p.primaryCountry, LOOKBACK_DAYS);
    if (series.length < 3) continue;

    const legacy = computeScore(series, weights);
    const footTrafficProximity = 1.0;
    const culturalProximity = 1.0;
    const linkBoost = 0;
    const composite =
      market.footTrafficAxisWeight * legacy.compositeScore * footTrafficProximity +
      market.culturalAxisWeight * legacy.compositeScore * culturalProximity +
      linkBoost;

    const row = {
      volume: legacy.volume,
      velocity: legacy.velocity,
      acceleration: legacy.acceleration,
      noiseAdjusted: legacy.noiseAdjusted,
      sourceDiversity: legacy.sourceDiversity,
      compositeScore: composite,
      footTrafficScore: legacy.compositeScore,
      culturalScore: legacy.compositeScore,
      footTrafficProximity,
      culturalProximity,
      linkBoost,
    };

    await db.phenomenonScore.upsert({
      where: {
        phenomenonId_marketId_date: {
          phenomenonId: p.id,
          marketId,
          date: today,
        },
      },
      create: {
        phenomenonId: p.id,
        marketId,
        country: p.primaryCountry,
        date: today,
        ...row,
      },
      update: row,
    });

    const recentScores = await db.phenomenonScore.findMany({
      where: { phenomenonId: p.id, marketId },
      orderBy: { date: 'desc' },
      take: 5,
      select: { volume: true, velocity: true, acceleration: true },
    });

    const newState = classifyState(recentScores);
    if (newState !== p.state) {
      await db.phenomenon.update({
        where: { id: p.id },
        data: { state: newState },
      });
      stateChanges++;
    }
    phenomenaScored++;
  }

  return { marketId, phenomenaScored, stateChanges, durationMs: Date.now() - start };
}

async function buildDailySeries(
  phenomenonId: string,
  country: string,
  days: number,
): Promise<DailyVolumePoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const signals = await prisma().rawSignal.findMany({
    where: { phenomenonId, country, publishedAt: { gte: since } },
    select: { publishedAt: true, sourceId: true },
    orderBy: { publishedAt: 'asc' },
  });

  const byDay = new Map<string, { count: number; sources: Set<string> }>();
  for (const s of signals) {
    const key = s.publishedAt.toISOString().slice(0, 10);
    const day = byDay.get(key) ?? { count: 0, sources: new Set() };
    day.count++;
    day.sources.add(s.sourceId);
    byDay.set(key, day);
  }

  const series: DailyVolumePoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const day = byDay.get(key);
    series.push({
      date: d,
      volume: day?.count ?? 0,
      sources: day?.sources.size ?? 0,
    });
  }
  return series;
}

interface ScoreRow {
  volume: number;
  velocity: number;
  acceleration: number;
  noiseAdjusted: number;
  sourceDiversity: number;
  compositeScore: number;
}

function computeScore(series: DailyVolumePoint[], w: Weights): ScoreRow {
  const today = series[series.length - 1];
  const recentAvg = movingAverage(series.slice(-7, -1), 'volume');
  const velocity = today.volume - recentAvg;
  const prevAvg = movingAverage(series.slice(-8, -2), 'volume');
  const prevVelocity = (series.at(-2)?.volume ?? 0) - prevAvg;
  const acceleration = velocity - prevVelocity;
  const mad = medianAbsoluteDeviation(series, 'volume');
  const noiseAdjusted = today.volume / Math.max(1, mad);
  const sourceDiversity = today.sources / Math.max(1, today.volume);

  const composite =
    w.velocity * normalise(velocity, -10, 10) +
    w.acceleration * normalise(acceleration, -5, 5) +
    w.noise * normalise(noiseAdjusted, 0, 10) +
    w.diversity * sourceDiversity;

  return { volume: today.volume, velocity, acceleration, noiseAdjusted, sourceDiversity, compositeScore: composite };
}

function classifyState(
  scores: { volume: number; velocity: number; acceleration: number }[],
): PhenomenonState {
  const recent = scores.slice(0, 3);
  if (recent.length < 2) return 'EMERGING';
  if (recent.every((s) => s.velocity > 0 && s.acceleration > 0)) return 'ACCELERATING';
  if (recent.every((s) => s.volume < DORMANT_THRESHOLD)) return 'DORMANT';
  if (recent.every((s) => s.velocity < 0)) return 'FADING';
  if (recent.every((s) => Math.abs(s.velocity) < STABLE_THRESHOLD)) return 'STABLE';
  return 'EMERGING';
}
