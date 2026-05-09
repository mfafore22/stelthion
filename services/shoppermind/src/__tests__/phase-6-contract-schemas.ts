import { z } from 'zod';

const Scope = z.object({
  customerId: z.string().optional(),
  marketId: z.string().optional(),
  propertyId: z.string().optional(),
  venueId: z.string().optional(),
});

const PolicyTrainingEvent = z.object({
  id: z.string().min(1),
  domain: z.literal('shoppermind'),
  scope: Scope.refine((scope) => Object.values(scope).some(Boolean)),
  source: z.enum(['review_outcome', 'user_feedback', 'offline_evaluation', 'shadow_evaluation']),
  resultId: z.string().min(1),
  outcome: z.enum(['accepted', 'rejected', 'corrected', 'expired', 'ignored']),
  observedAt: z.string().min(1),
  actorId: z.string().optional(),
  quality: z.object({ decision: z.string(), handling: z.string() }).passthrough().optional(),
  features: z.record(z.unknown()).optional(),
  labels: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TrainingNdjsonContract = z.object({
  reviewItemId: z.string().min(1),
  marketId: z.string().min(1),
  phenomenonId: z.string().min(1),
  gateDecision: z.string().min(1),
  reviewerAction: z.enum(['APPROVED', 'REJECTED', 'EXPIRED']).nullable(),
  reviewerNote: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  reasons: z.array(z.string()),
  // NDJSON keeps metrics snapshots heterogeneous. PolicyTrainingEvent owns
  // the normalized quality contract for downstream policy consumers.
  metricsSnapshot: z.unknown(),
  narrativeDraft: z.string().nullable(),
  phenomenon: z.object({
    label: z.string().min(1),
    description: z.string().nullable(),
    phenomenonType: z.string().nullable(),
    culturalScope: z.string().nullable(),
    culturalLocality: z.string().nullable(),
    footTrafficScope: z.string().nullable(),
    footTrafficLocality: z.string().nullable(),
    state: z.string().min(1),
  }),
});

export const PolicyTrainingEventContract = PolicyTrainingEvent;

export const AgentRouteDecisionContract = z.object({
  agentId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).min(1),
  alternatives: z.array(z.object({
    agentId: z.string().min(1),
    confidence: z.number().min(0).max(1),
    reasons: z.array(z.string()),
  })),
});
