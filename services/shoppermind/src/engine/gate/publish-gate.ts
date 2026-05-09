import { prisma } from '../../db/prisma.js';
import { evaluate } from '../policy/policy-engine.js';
import type { MetricsSnapshot, PolicyResult } from '../policy/policy-types.js';
import { qualityFromMetrics } from '../quality/envelope.js';
import type { MarketPolicy } from '../registry/market-schema.js';

export interface GateContext {
  marketId: string;
  policy: MarketPolicy;
  narrativeDraft?: string;
}

export interface GateOutput {
  decision: PolicyResult['decision'];
  reviewItemId?: string;
  signalOfTheDayId?: string;
}

// Receives a scored phenomenon snapshot and routes it:
//   PUBLISH → SignalOfTheDay (immediate) + PENDING ReviewItem (for audit / override)
//   REVIEW  → PENDING ReviewItem
//   REJECT  → REJECTED ReviewItem (retained for audit + training data)
export async function gate(
  snapshot: MetricsSnapshot,
  ctx: GateContext,
): Promise<GateOutput> {
  const result = evaluate({ snapshot, policy: ctx.policy });
  const quality = qualityFromMetrics(snapshot);
  const decision = applyQualityDecision(result.decision, quality.decision);
  const reasons = [...result.reasons, ...quality.reasons.map((r) => `quality:${r}`)];

  const review = await prisma().reviewItem.create({
    data: {
      marketId: ctx.marketId,
      phenomenonId: snapshot.phenomenonId,
      status: decision === 'REJECT' ? 'REJECTED' : 'PENDING',
      decision,
      reasons,
      metricsSnapshot: { ...snapshot, quality } as unknown as object,
      narrativeDraft: ctx.narrativeDraft ?? null,
      appliedAction: decision === 'REJECT' ? 'REJECTED' : null,
      resolvedAt: decision === 'REJECT' ? new Date() : null,
      resolvedBy: decision === 'REJECT' ? 'auto-gate' : null,
    },
  });

  if (decision !== 'PUBLISH') {
    return { decision, reviewItemId: review.id };
  }

  const date = new Date(snapshot.date);
  const existing = await prisma().signalOfTheDay.findUnique({
    where: { marketId_date: { marketId: ctx.marketId, date } },
  });

  const phenomenonIds = existing
    ? Array.from(new Set([...existing.phenomenonIds, snapshot.phenomenonId]))
    : [snapshot.phenomenonId];

  const sot = await prisma().signalOfTheDay.upsert({
    where: { marketId_date: { marketId: ctx.marketId, date } },
    create: {
      marketId: ctx.marketId,
      country: snapshot.country,
      date,
      phenomenonIds,
      narrative: ctx.narrativeDraft ?? '',
    },
    update: {
      phenomenonIds: { set: phenomenonIds },
      narrative: ctx.narrativeDraft ?? existing?.narrative ?? '',
    },
  });

  return {
    decision,
    reviewItemId: review.id,
    signalOfTheDayId: sot.id,
  };
}

function applyQualityDecision(
  policyDecision: PolicyResult['decision'],
  qualityDecision: 'publish' | 'review' | 'reject' | 'hold',
): PolicyResult['decision'] {
  if (qualityDecision === 'hold' || qualityDecision === 'reject') return 'REJECT';
  if (qualityDecision === 'review' && policyDecision === 'PUBLISH') return 'REVIEW';
  return policyDecision;
}
