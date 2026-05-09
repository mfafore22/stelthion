import {
  buildQualityEnvelope,
  type QualityEnvelope,
} from '@stelthion/intelligence-runtime';
import type { MetricsSnapshot } from '../policy/policy-types.js';
import type { CorpusDocument } from '../insights/phenomenon-corpus.js';
import type { SourceEvidence } from './source-evidence.js';

export interface InsightQualityView {
  freshness: QualityEnvelope['freshness'];
  quality: QualityEnvelope;
  evidence: {
    sourceCount: number;
    strongSourceCount: number;
    sourceIds: string[];
  };
  decisionReasons: string[];
  handlingMode: QualityEnvelope['handling'];
}

export function qualityFromMetrics(snapshot: MetricsSnapshot): QualityEnvelope {
  const feedbackTotal = snapshot.positiveFeedback + snapshot.negativeFeedback;
  const feedbackScore = feedbackTotal > 0
    ? (snapshot.positiveFeedback - snapshot.negativeFeedback) / feedbackTotal
    : 0;
  return buildQualityEnvelope({
    confidence: snapshot.compositeScore,
    sourceStrength: Math.min(1, snapshot.strongSourceCount / 3),
    sourceCount: Math.max(snapshot.strongSourceCount, Math.round(snapshot.sourceDiversity * 4)),
    feedbackScore,
    lifecycleRisk: snapshot.lifecycleState === 'CONCLUDED' ? 0.7 : 0,
    lastObservedAt: new Date(snapshot.date),
  });
}

export function qualityViewFromScore(
  score: Record<string, any>,
  evidence?: SourceEvidence,
): InsightQualityView {
  const fallbackCount = Math.max(1, Math.round(Number(score.sourceDiversity ?? 0) * 4));
  const sourceCount = evidence?.sourceCount ?? fallbackCount;
  const strongSourceCount = evidence?.strongSourceCount ?? Math.min(sourceCount, 3);
  const sourceStrength = sourceCount > 0 ? Math.min(1, strongSourceCount / sourceCount) : 0;
  const quality = buildQualityEnvelope({
    confidence: Number(score.compositeScore ?? 0),
    sourceStrength,
    sourceCount,
    lifecycleRisk: score.phenomenon?.lifecycleState === 'CONCLUDED' ? 0.7 : 0,
    lastObservedAt: score.date instanceof Date ? score.date : new Date(score.date),
  });
  return {
    freshness: quality.freshness,
    quality,
    evidence: { sourceCount, strongSourceCount, sourceIds: evidence?.sourceIds ?? [] },
    decisionReasons: quality.reasons,
    handlingMode: quality.handling,
  };
}

export function qualityViewFromCorpus(doc: CorpusDocument, score = 1): InsightQualityView {
  const sourceCount = doc.metadata.sourceCount;
  const strongSourceCount = doc.metadata.strongSourceCount;
  const sourceStrength = sourceCount > 0 ? Math.min(1, strongSourceCount / sourceCount) : 0;
  const quality = buildQualityEnvelope({
    confidence: Number(doc.metadata.latestCompositeScore ?? score),
    sourceStrength,
    sourceCount,
    lastObservedAt: new Date(doc.metadata.lastSignalAt),
  });
  return {
    freshness: quality.freshness,
    quality,
    evidence: { sourceCount, strongSourceCount, sourceIds: doc.metadata.sourceIds },
    decisionReasons: quality.reasons,
    handlingMode: quality.handling,
  };
}
