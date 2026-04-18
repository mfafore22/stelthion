import type { PhenomenonType } from '../policy/policy-types.js';

export interface ClassifierInput {
  label: string;
  description: string;
  keywords: string[];
}

export interface ClassifierResult {
  type: PhenomenonType;
  eventStart?: Date;
  eventEnd?: Date;
  confidence: number;
}

// Phase 1: stub — always TREND, no dates.
// Phase 2 replaces this with gazetteer priors + LLM classification.
export function classify(_input: ClassifierInput): ClassifierResult {
  return { type: 'TREND', confidence: 1 };
}
