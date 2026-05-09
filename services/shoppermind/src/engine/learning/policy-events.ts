import type { PolicyTrainingEvent, QualityEnvelope } from '@stelthion/intelligence-runtime';
import type { InteractionRecord } from '../insights/feedback-collector.js';
import type { TrainingRecord } from '../insights/training-export.js';

const POSITIVE = new Set(['relevant', 'star', 'thumbs_up', 'up', 'positive']);
const NEGATIVE = new Set(['not_relevant', 'noise', 'thumbs_down', 'down', 'negative']);

export function reviewRecordToPolicyTrainingEvent(
  record: TrainingRecord,
): PolicyTrainingEvent {
  return {
    id: `shoppermind:review:${record.reviewItemId}`,
    domain: 'shoppermind',
    scope: { marketId: record.marketId },
    source: 'review_outcome',
    resultId: record.phenomenonId,
    outcome: reviewOutcome(record.reviewerAction),
    observedAt: record.resolvedAt ?? record.createdAt,
    actorId: record.resolvedBy ?? undefined,
    quality: qualityFromSnapshot(record.metricsSnapshot),
    features: objectRecord(record.metricsSnapshot),
    labels: {
      gateDecision: record.gateDecision,
      reviewerAction: record.reviewerAction,
      phenomenonType: record.phenomenon.phenomenonType,
      state: record.phenomenon.state,
    },
    notes: record.reviewerNote ?? undefined,
    metadata: { reviewItemId: record.reviewItemId, reasons: record.reasons },
  };
}

export function interactionToPolicyTrainingEvent(
  record: InteractionRecord,
): PolicyTrainingEvent {
  return {
    id: `shoppermind:feedback:${record.id}`,
    domain: 'shoppermind',
    scope: { marketId: record.marketId ?? undefined },
    source: 'user_feedback',
    resultId: record.phenomenonId,
    outcome: feedbackOutcome(record.verdict),
    observedAt: record.createdAt,
    actorId: record.userId,
    features: {
      interactionKind: record.interactionKind,
      verdict: record.verdict,
    },
    labels: { userVerdict: record.verdict },
    notes: record.note ?? undefined,
    metadata: { feedbackId: record.id },
  };
}

function reviewOutcome(
  action: TrainingRecord['reviewerAction'],
): PolicyTrainingEvent['outcome'] {
  if (action === 'APPROVED') return 'accepted';
  if (action === 'REJECTED') return 'rejected';
  if (action === 'EXPIRED') return 'expired';
  return 'ignored';
}

function feedbackOutcome(verdict: string): PolicyTrainingEvent['outcome'] {
  if (POSITIVE.has(verdict)) return 'accepted';
  if (NEGATIVE.has(verdict)) return 'rejected';
  return 'ignored';
}

function qualityFromSnapshot(value: unknown): QualityEnvelope | undefined {
  const quality = objectRecord(value)?.quality;
  return quality && typeof quality === 'object' ? (quality as QualityEnvelope) : undefined;
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}
