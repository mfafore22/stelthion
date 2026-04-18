import type { PhenomenonState } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { movingAverage, medianAbsoluteDeviation, normalise } from './lib/stats.js';
import { getWeights, type Weights } from './weights.js';
import { loadMarket } from './registry/market-registry.js';
import { proximityWeight, type MarketProximityContext } from './locality/proximity.js';
import { computeLifecycle } from './taxonomy/lifecycle.js';
import { applyLinkBoost, type ContributorPhenomenon, type LinkForBoost } from './linking/link-boost.js';
import type { Scope, LifecycleState, PhenomenonType } from './policy/policy-types.js';
import type { MarketConfig } from './registry/market-schema.js';

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
 * Phase 2 scoring: computes per-axis proximity against the market's subscription
 * set, applies link-boost from ACTIVE contributor phenomena, and recomputes
 * lifecycleState each run. Phase 1 parity holds when a market subscribes only
 * to its own COUNTRY on both axes and phenomena are same-country: proximity
 * resolves to 1.0/1.0, linkBoost=0 (no links exist on imported rows), composite
 * = ftW*legacy + cW*legacy = legacy.
 */
export async function runScoring(marketId: string): Promise<ScoreSummary> {
  const start = Date.now();
  const db = prisma();
  const market = await loadMarket(marketId);
  if (!market) {
    return { marketId, phenomenaScored: 0, stateChanges: 0, durationMs: 0 };
  }

  const ctx = buildProximityContext(market);
  const phenomena = await db.phenomenon.findMany({
    where: { mergedInto: null, ...buildPhenomenonVisibilityWhere(ctx) },
    select: {
      id: true,
      primaryCountry: true,
      state: true,
      phenomenonType: true,
      lifecycleState: true,
      eventStart: true,
      eventEnd: true,
      culturalScope: true,
      culturalLocality: true,
      footTrafficScope: true,
      footTrafficLocality: true,
    },
  });

  const weights = await getWeights(marketId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  let phenomenaScored = 0;
  let stateChanges = 0;

  for (const p of phenomena) {
    const ftScope = (p.footTrafficScope ?? 'COUNTRY') as Scope;
    const ftLocality = p.footTrafficLocality ?? p.primaryCountry;
    const cScope = (p.culturalScope ?? 'COUNTRY') as Scope;
    const cLocality = p.culturalLocality ?? p.primaryCountry;

    const footTrafficProximity = proximityWeight(
      { scope: ftScope, localityId: ftLocality },
      ctx,
      'footTraffic',
    );
    const culturalProximity = proximityWeight(
      { scope: cScope, localityId: cLocality },
      ctx,
      'cultural',
    );
    if (footTrafficProximity === 0 && culturalProximity === 0) continue;

    const series = await buildDailySeries(p.id, p.primaryCountry, LOOKBACK_DAYS);
    if (series.length < 3) continue;

    const legacy = computeScore(series, weights);

    // Recompute lifecycleState on each run so UPCOMING → ACTIVE → CONCLUDED
    // transitions track wall-clock time without needing a separate job.
    const nextLifecycle = computeLifecycle(
      {
        phenomenonType: (p.phenomenonType ?? 'TREND') as PhenomenonType,
        eventStart: p.eventStart,
        eventEnd: p.eventEnd,
      },
      now,
    );
    if (nextLifecycle !== (p.lifecycleState as LifecycleState | null)) {
      await db.phenomenon.update({
        where: { id: p.id },
        data: { lifecycleState: nextLifecycle },
      });
    }

    // Link-boost: velocity contribution from ACTIVE contributors whose
    // phenomenon links into this one (CONTRIBUTES_TO / MANIFESTATION_OF /
    // ACCELERATES). Only applies when this phenomenon is a TREND — events and
    // incidents get their own lifecycle-driven bars from the policy layer.
    let linkBoost = 0;
    if ((p.phenomenonType ?? 'TREND') === 'TREND' && legacy.velocity > 0) {
      linkBoost = await computeLinkBoost(p.id, legacy.velocity);
    }

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

function buildProximityContext(market: MarketConfig): MarketProximityContext {
  const anchor =
    market.geoAnchorLat != null && market.geoAnchorLon != null
      ? { lat: market.geoAnchorLat, lon: market.geoAnchorLon }
      : null;
  // Merge both axis subscription sets so `proximityWeight` sees the full
  // parent-scope hierarchy when deciding distance vs. hierarchy fallback.
  const subs = Array.from(new Set([...market.footTrafficSubs, ...market.culturalSubs]));
  return {
    anchor,
    country: market.country,
    region: market.region ?? null,
    subscriptions: subs,
  };
}

function buildPhenomenonVisibilityWhere(ctx: MarketProximityContext): {
  primaryCountry?: { in: string[] };
} {
  // Markets subscribed to GLOBAL on either axis can see phenomena from any
  // country — don't narrow the query. Otherwise narrow to primaryCountry IN
  // the countries this market has a subscription path to.
  if (ctx.subscriptions.includes('GLOBAL')) return {};
  const countries = new Set<string>([ctx.country]);
  for (const sub of ctx.subscriptions) {
    const [scope, id] = sub.split(':');
    if (scope === 'COUNTRY' && id) countries.add(id);
  }
  return { primaryCountry: { in: Array.from(countries) } };
}

async function computeLinkBoost(phenomenonId: string, velocity: number): Promise<number> {
  const db = prisma();
  const links = await db.phenomenonLink.findMany({
    where: { toPhenomenonId: phenomenonId, supersededAt: null },
    select: { fromPhenomenonId: true, toPhenomenonId: true, linkType: true, weight: true },
  });
  if (links.length === 0) return 0;

  const contributorIds = links.map((l) => l.fromPhenomenonId);
  const contributors = await db.phenomenon.findMany({
    where: { id: { in: contributorIds }, mergedInto: null },
    select: { id: true, lifecycleState: true },
  });

  // Pull the most-recent velocity per contributor across any market. Link-boost
  // is a property of the contributor's native trajectory; using the latest
  // known velocity avoids coupling the boost to the scoring market's proximity.
  const recentScores = await db.phenomenonScore.findMany({
    where: { phenomenonId: { in: contributorIds } },
    orderBy: { date: 'desc' },
    take: contributorIds.length * 3,
    select: { phenomenonId: true, velocity: true, date: true },
  });
  const velByContributor = new Map<string, number>();
  for (const s of recentScores) {
    if (!velByContributor.has(s.phenomenonId)) {
      velByContributor.set(s.phenomenonId, s.velocity);
    }
  }

  const contribList: ContributorPhenomenon[] = contributors.map((c) => ({
    id: c.id,
    velocity: velByContributor.get(c.id) ?? 0,
    lifecycleState: c.lifecycleState as LifecycleState | null,
  }));

  const linkList: LinkForBoost[] = links.map((l) => ({
    fromPhenomenonId: l.fromPhenomenonId,
    toPhenomenonId: l.toPhenomenonId,
    linkType: l.linkType as LinkForBoost['linkType'],
    weight: l.weight,
  }));

  const result = applyLinkBoost({ id: phenomenonId, velocity }, linkList, contribList);
  return result.boost;
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
