import type { MemoryDocument } from './memory.js';
import type { QualityEnvelope } from './quality.js';
import type { IntelligenceDomain, RuntimeContext, RuntimeDecision } from './runtime.js';
import type { LocalizedText } from './localized-text.js';

export interface RawSignal {
  id: string;
  title: string;
  body?: string;
  sourceId: string;
  observedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EnrichedSignal extends RawSignal {
  entityIds: string[];
  categories: string[];
  summary?: string;
}

export interface ScoreResult {
  entityId: string;
  relevance: number;
  confidence: number;
  sourceStrength: number;
  reasons: string[];
}

export interface UserFacingResult {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  quality: QualityEnvelope;
  sourceIds: string[];
  metadata?: Record<string, unknown>;
}

export interface AdapterDecisionEvent {
  resultId: string;
  decision: RuntimeDecision['decision'];
  reasons: string[];
  actorId: string;
  decidedAt: string;
}

export interface AdapterFeedbackEvent {
  resultId: string;
  outcome: 'accepted' | 'rejected' | 'corrected';
  notes?: string;
  actorId: string;
  createdAt: string;
}

export interface IntelligenceDomainAdapter {
  domain: IntelligenceDomain;
  collectSources(context: RuntimeContext): Promise<RawSignal[]>;
  enrichSignal(signal: RawSignal, context: RuntimeContext): Promise<EnrichedSignal>;
  buildMemoryDocument(signal: EnrichedSignal, context: RuntimeContext): Promise<MemoryDocument>;
  scoreRelevance(document: MemoryDocument, context: RuntimeContext): Promise<ScoreResult>;
  createUserResult(document: MemoryDocument, score: ScoreResult, quality: QualityEnvelope): Promise<UserFacingResult>;
  onDecision?(event: AdapterDecisionEvent, context: RuntimeContext): Promise<void>;
  onFeedback?(event: AdapterFeedbackEvent, context: RuntimeContext): Promise<void>;
}
