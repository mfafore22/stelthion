import type { MarketPolicy } from '../registry/market-schema.js';

export type Axis = 'composite' | 'footTraffic' | 'cultural';
export type Scope = 'CITY' | 'REGION' | 'COUNTRY' | 'GLOBAL';
export type PhenomenonType = 'TREND' | 'EVENT' | 'CAMPAIGN' | 'INCIDENT';
export type LifecycleState = 'UPCOMING' | 'ACTIVE' | 'CONCLUDED';
export type Decision = 'PUBLISH' | 'REVIEW' | 'REJECT';

export interface MetricsSnapshot {
  date: string;
  marketId: string;
  country: string;
  phenomenonId: string;
  phenomenonType: PhenomenonType;
  lifecycleState: LifecycleState | null;
  culturalScope: Scope;
  culturalLocality: string;
  footTrafficScope: Scope;
  footTrafficLocality: string;
  volume: number;
  velocity: number;
  acceleration: number;
  sourceDiversity: number;
  strongSourceCount: number;
  noiseAdjusted: number;
  footTrafficScore: number;
  culturalScore: number;
  footTrafficProximity: number;
  culturalProximity: number;
  linkBoost: number;
  compositeScore: number;
  negativeFeedback: number;
  positiveFeedback: number;
}

export interface PolicyInput {
  snapshot: MetricsSnapshot;
  policy: MarketPolicy;
}

export interface PolicyResult {
  decision: Decision;
  reasons: string[];
  snapshot: MetricsSnapshot;
  effectiveThreshold: { publish: number; review: number; reject: number };
  thresholdKey: string;
}

export type { MarketPolicy };
