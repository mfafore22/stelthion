import { prisma } from '../../db/prisma.js';
import { evaluate } from '../policy/policy-engine.js';
import type { MetricsSnapshot, PolicyResult } from '../policy/policy-types.js';
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

  const review = await prisma().reviewItem.create({
    data: {
      marketId: ctx.marketId,
      phenomenonId: snapshot.phenomenonId,
      status: result.decision === 'REJECT' ? 'REJECTED' : 'PENDING',
      decision: result.decision,
      reasons: result.reasons,
      metricsSnapshot: snapshot as unknown as object,
      narrativeDraft: ctx.narrativeDraft ?? null,
      appliedAction: result.decision === 'REJECT' ? 'REJECTED' : null,
      resolvedAt: result.decision === 'REJECT' ? new Date() : null,
      resolvedBy: result.decision === 'REJECT' ? 'auto-gate' : null,
    },
  });

  if (result.decision !== 'PUBLISH') {
    return { decision: result.decision, reviewItemId: review.id };
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
    decision: result.decision,
    reviewItemId: review.id,
    signalOfTheDayId: sot.id,
  };
}
