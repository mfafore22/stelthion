import type { PolicyTrainingEvent } from '@stelthion/intelligence-runtime';
import { prisma } from '../../db/prisma.js';
import type { InteractionRecord } from '../insights/feedback-collector.js';
import { interactionToPolicyTrainingEvent } from './policy-events.js';

export interface FeedbackTrainingEventQuery {
  phenomenonId?: string;
  marketId?: string;
  since?: Date;
  limit?: number;
}

export async function* streamFeedbackPolicyTrainingEvents(
  q: FeedbackTrainingEventQuery,
): AsyncGenerator<PolicyTrainingEvent> {
  const pageSize = 500;
  const hardLimit = q.limit ?? Number.POSITIVE_INFINITY;
  let emitted = 0;
  let cursor: string | undefined;

  while (emitted < hardLimit) {
    const batch = await prisma().phenomenonFeedback.findMany({
      where: {
        ...(q.phenomenonId ? { phenomenonId: q.phenomenonId } : {}),
        ...(q.marketId ? { marketId: q.marketId } : {}),
        ...(q.since ? { createdAt: { gte: q.since } } : {}),
      },
      orderBy: { id: 'asc' },
      take: pageSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (batch.length === 0) break;
    for (const row of batch) {
      if (emitted >= hardLimit) return;
      yield interactionToPolicyTrainingEvent(toInteractionRecord(row));
      emitted++;
    }
    cursor = batch[batch.length - 1]!.id;
    if (batch.length < pageSize) break;
  }
}

function toInteractionRecord(row: {
  id: string;
  phenomenonId: string;
  marketId: string | null;
  userId: string;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: Date;
}): InteractionRecord {
  return {
    id: row.id,
    phenomenonId: row.phenomenonId,
    marketId: row.marketId,
    userId: row.userId,
    interactionKind: row.interactionKind,
    verdict: row.verdict,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}
