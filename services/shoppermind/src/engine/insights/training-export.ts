import { prisma } from '../../db/prisma.js';
import { reviewRecordToPolicyTrainingEvent } from '../learning/policy-events.js';
import type { PolicyTrainingEvent } from '@stelthion/intelligence-runtime';

export interface TrainingExportQuery {
  marketId?: string;
  status?: Array<'APPROVED' | 'REJECTED' | 'EXPIRED' | 'PENDING'>;
  since?: Date;
  until?: Date;
  limit?: number;
}

export interface TrainingRecord {
  reviewItemId: string;
  marketId: string;
  phenomenonId: string;
  gateDecision: string;
  reviewerAction: 'APPROVED' | 'REJECTED' | 'EXPIRED' | null;
  reviewerNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reasons: string[];
  metricsSnapshot: unknown;
  narrativeDraft: string | null;
  phenomenon: {
    label: string;
    description: string | null;
    phenomenonType: string | null;
    culturalScope: string | null;
    culturalLocality: string | null;
    footTrafficScope: string | null;
    footTrafficLocality: string | null;
    state: string;
  };
}

/**
 * Stream ReviewItem rows as training records: `{ snapshot, decision,
 * reviewer override }` triples that the offline policy/narrative training
 * pipeline consumes. Resolved rows (APPROVED/REJECTED/EXPIRED) are the high-
 * signal cases — reviewer actions constitute human ground truth over the
 * gate's decision. PENDING rows are exportable too (useful for semi-
 * supervised setups) but are excluded by default.
 *
 * Returns an async generator so callers can stream to NDJSON without holding
 * the full result set in memory.
 */
export async function* streamTrainingRecords(
  q: TrainingExportQuery,
): AsyncGenerator<TrainingRecord> {
  const statuses = q.status ?? ['APPROVED', 'REJECTED', 'EXPIRED'];
  const pageSize = 500;
  const hardLimit = q.limit ?? Number.POSITIVE_INFINITY;

  let emitted = 0;
  let cursor: string | undefined;

  while (emitted < hardLimit) {
    const batch = await prisma().reviewItem.findMany({
      where: {
        ...(q.marketId ? { marketId: q.marketId } : {}),
        status: { in: statuses },
        ...(q.since ? { createdAt: { gte: q.since } } : {}),
        ...(q.until ? { createdAt: { lte: q.until } } : {}),
      },
      include: { phenomenon: true },
      orderBy: { id: 'asc' },
      take: pageSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (batch.length === 0) break;

    for (const row of batch) {
      if (emitted >= hardLimit) return;
      yield {
        reviewItemId: row.id,
        marketId: row.marketId,
        phenomenonId: row.phenomenonId,
        gateDecision: row.decision,
        reviewerAction:
          row.status === 'APPROVED'
            ? 'APPROVED'
            : row.status === 'REJECTED'
              ? 'REJECTED'
              : row.status === 'EXPIRED'
                ? 'EXPIRED'
                : null,
        reviewerNote: row.resolutionNote,
        resolvedBy: row.resolvedBy,
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        reasons: row.reasons,
        metricsSnapshot: row.metricsSnapshot,
        narrativeDraft: row.narrativeDraft,
        phenomenon: {
          label: row.phenomenon.label,
          description: row.phenomenon.description,
          phenomenonType: row.phenomenon.phenomenonType,
          culturalScope: row.phenomenon.culturalScope,
          culturalLocality: row.phenomenon.culturalLocality,
          footTrafficScope: row.phenomenon.footTrafficScope,
          footTrafficLocality: row.phenomenon.footTrafficLocality,
          state: row.phenomenon.state,
        },
      };
      emitted++;
    }

    cursor = batch[batch.length - 1]!.id;
    if (batch.length < pageSize) break;
  }
}

export async function* streamPolicyTrainingEvents(
  q: TrainingExportQuery,
): AsyncGenerator<PolicyTrainingEvent> {
  for await (const record of streamTrainingRecords(q)) {
    yield reviewRecordToPolicyTrainingEvent(record);
  }
}
