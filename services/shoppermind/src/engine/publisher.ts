import { prisma } from '../db/prisma.js';
import { loadMarket } from './registry/market-registry.js';
import { generateNarrative } from './prompts.js';
import { gate } from './gate/publish-gate.js';
import { getFeedbackCounts } from './policy/feedback-aggregator.js';
import { DEFAULT_POLICY } from './policy/default-policies.js';
import type { MetricsSnapshot, Scope } from './policy/policy-types.js';

export interface PublishSummary {
  marketId: string;
  published: number;
  reviewed: number;
  rejected: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

const TOP_N = 5;

/**
 * Phase 1 publisher: gathers today's top scored phenomena for a market,
 * generates a single market-level narrative draft, then routes each item
 * through the gate. Gate decides PUBLISH/REVIEW/REJECT per item; SignalOfTheDay
 * is upserted via the gate, so the legacy "one row per market per day" model
 * is preserved (phenomenonIds accumulates across PUBLISH decisions).
 */
export async function runPublisher(marketId: string): Promise<PublishSummary> {
  const start = Date.now();
  const db = prisma();
  const market = await loadMarket(marketId);
  if (!market) {
    return { marketId, published: 0, reviewed: 0, rejected: 0, skipped: 0, errors: 0, durationMs: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scored = await db.phenomenonScore.findMany({
    where: { marketId, date: today },
    orderBy: { compositeScore: 'desc' },
    take: TOP_N,
    include: {
      phenomenon: true,
    },
  });

  if (scored.length === 0) {
    return {
      marketId,
      published: 0,
      reviewed: 0,
      rejected: 0,
      skipped: 1,
      errors: 0,
      durationMs: Date.now() - start,
    };
  }

  const active = scored.filter(
    (s) =>
      s.phenomenon.mergedInto === null &&
      ['EMERGING', 'ACCELERATING', 'STABLE'].includes(s.phenomenon.state),
  );

  if (active.length === 0) {
    return {
      marketId,
      published: 0,
      reviewed: 0,
      rejected: 0,
      skipped: 1,
      errors: 0,
      durationMs: Date.now() - start,
    };
  }

  let narrative = '';
  try {
    narrative = await generateNarrative(
      market.profile,
      active.map((s) => ({
        label: s.phenomenon.label,
        description: s.phenomenon.description ?? '',
        compositeScore: s.compositeScore,
        state: s.phenomenon.state,
        velocity: s.velocity,
      })),
      market.profile.language,
    );
  } catch {
    narrative = '';
  }

  let published = 0;
  let reviewed = 0;
  let rejected = 0;
  let errors = 0;

  const windowDays =
    market.policy.feedbackSensitivity?.windowDays ??
    DEFAULT_POLICY.feedbackSensitivity?.windowDays ??
    30;

  for (const s of active) {
    try {
      const feedback = await getFeedbackCounts(s.phenomenonId, marketId, windowDays);
      const snapshot: MetricsSnapshot = {
        date: today.toISOString(),
        marketId,
        country: s.country,
        phenomenonId: s.phenomenonId,
        phenomenonType: (s.phenomenon.phenomenonType ?? 'TREND') as MetricsSnapshot['phenomenonType'],
        lifecycleState: s.phenomenon.lifecycleState as MetricsSnapshot['lifecycleState'],
        culturalScope: (s.phenomenon.culturalScope ?? 'COUNTRY') as Scope,
        culturalLocality: s.phenomenon.culturalLocality ?? s.country,
        footTrafficScope: (s.phenomenon.footTrafficScope ?? 'COUNTRY') as Scope,
        footTrafficLocality: s.phenomenon.footTrafficLocality ?? s.country,
        volume: s.volume,
        velocity: s.velocity,
        acceleration: s.acceleration,
        sourceDiversity: s.sourceDiversity,
        noiseAdjusted: s.noiseAdjusted,
        footTrafficScore: s.footTrafficScore,
        culturalScore: s.culturalScore,
        footTrafficProximity: s.footTrafficProximity,
        culturalProximity: s.culturalProximity,
        linkBoost: s.linkBoost,
        compositeScore: s.compositeScore,
        negativeFeedback: feedback.negative,
        positiveFeedback: feedback.positive,
      };

      const result = await gate(snapshot, {
        marketId,
        policy: market.policy,
        narrativeDraft: narrative || undefined,
      });
      if (result.decision === 'PUBLISH') published++;
      else if (result.decision === 'REVIEW') reviewed++;
      else rejected++;
    } catch {
      errors++;
    }
  }

  return {
    marketId,
    published,
    reviewed,
    rejected,
    skipped: 0,
    errors,
    durationMs: Date.now() - start,
  };
}
