import type { TrainingRecord } from '../insights/training-export.js';
import { getLearningPort } from './learning-port.js';
import { reviewRecordToPolicyTrainingEvent } from './policy-events.js';

export interface ReviewLearningRow {
  id: string;
  marketId: string;
  phenomenonId: string;
  decision: string;
  status: 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'PENDING';
  reasons: string[];
  metricsSnapshot: unknown;
  narrativeDraft: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
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

export async function persistReviewPolicyEvent(row: ReviewLearningRow): Promise<void> {
  await getLearningPort().appendTrainingEvent(reviewRecordToPolicyTrainingEvent(toRecord(row)));
}

function toRecord(row: ReviewLearningRow): TrainingRecord {
  return {
    reviewItemId: row.id,
    marketId: row.marketId,
    phenomenonId: row.phenomenonId,
    gateDecision: row.decision,
    reviewerAction: reviewerAction(row.status),
    reviewerNote: row.resolutionNote,
    resolvedBy: row.resolvedBy,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    reasons: row.reasons,
    metricsSnapshot: row.metricsSnapshot,
    narrativeDraft: row.narrativeDraft,
    phenomenon: row.phenomenon,
  };
}

function reviewerAction(status: ReviewLearningRow['status']): TrainingRecord['reviewerAction'] {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'EXPIRED') return 'EXPIRED';
  return null;
}
