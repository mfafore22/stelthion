import prisma from '@/app/lib/prisma';
import { movingAverage, medianAbsoluteDeviation, normalise } from '@/lib/stats';
import { getWeights } from './weights';
import type { PhenomenonState } from '@prisma/client';

const DORMANT_THRESHOLD = 2;
const STABLE_THRESHOLD = 0.5;
const LOOKBACK_DAYS = 28;

export interface ScoreSummary {
  phenomenaScored: number;
  stateChanges: number;
  durationMs: number;
}

interface DailyVolumePoint {
  date: Date;
  volume: number;
  sources: number;
}

export async function runScoring(): Promise<ScoreSummary> {
  const start = Date.now();
  const phenomena = await prisma.phenomenon.findMany({
    where: { mergedInto: null },
    select: { id: true, primaryCountry: true, state: true },
  });

  let phenomenaScored = 0;
  let stateChanges = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of phenomena) {
    const series = await buildDailySeries(p.id, p.primaryCountry, LOOKBACK_DAYS);
    if (series.length < 3) continue;

    const weights = await getWeights(p.primaryCountry);
    const score = computeScore(series, weights);

    await prisma.phenomenonScore.upsert({
      where: {
        phenomenonId_country_date: {
          phenomenonId: p.id,
          country: p.primaryCountry,
          date: today,
        },
      },
      create: {
        phenomenonId: p.id,
        country: p.primaryCountry,
        date: today,
        ...score,
      },
      update: score,
    });

    const recentScores = await prisma.phenomenonScore.findMany({
      where: { phenomenonId: p.id, country: p.primaryCountry },
      orderBy: { date: 'desc' },
      take: 5,
      select: { volume: true, velocity: true, acceleration: true },
    });

    const newState = classifyState(recentScores);
    if (newState !== p.state) {
      await prisma.phenomenon.update({
        where: { id: p.id },
        data: { state: newState },
      });
      stateChanges++;
    }
    phenomenaScored++;
  }

  return { phenomenaScored, stateChanges, durationMs: Date.now() - start };
}

async function buildDailySeries(
  phenomenonId: string,
  country: string,
  days: number,
): Promise<DailyVolumePoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const signals = await prisma.rawSignal.findMany({
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

interface Weights {
  velocity: number;
  acceleration: number;
  noise: number;
  diversity: number;
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
