// Hand-written types for the ShopperMind v1 HTTP API.
// In Phase 2, these move to OpenAPI-generated output (keeps the same module shape).

export type Scope = 'CITY' | 'REGION' | 'COUNTRY' | 'GLOBAL';
export type PhenomenonType = 'TREND' | 'EVENT' | 'CAMPAIGN' | 'INCIDENT';
export type LifecycleState = 'UPCOMING' | 'ACTIVE' | 'CONCLUDED';
export type PhenomenonStateValue =
  | 'EMERGING'
  | 'ACCELERATING'
  | 'STABLE'
  | 'FADING'
  | 'DORMANT';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type LinkType =
  | 'CONTRIBUTES_TO'
  | 'MANIFESTATION_OF'
  | 'ACCELERATES'
  | 'PRECEDES'
  | 'CONTRADICTS';

export interface MarketSummary {
  id: string;
  country: string;
  region: string | null;
  displayName: string;
  industryFocus: string;
  active: boolean;
}

export interface MarketDetail extends MarketSummary {
  footTrafficSubs: string[];
  culturalSubs: string[];
  footTrafficAxisWeight: number;
  culturalAxisWeight: number;
  profile: Record<string, unknown>;
}

export interface MarketListResponse {
  markets: MarketSummary[];
}

export interface PhenomenonSummary {
  id: string;
  label: string;
  description: string;
  state: PhenomenonStateValue;
  phenomenonType: PhenomenonType | null;
  lifecycleState: LifecycleState | null;
  culturalScope: Scope | null;
  culturalLocality: string | null;
  footTrafficScope: Scope | null;
  footTrafficLocality: string | null;
  compositeScore: number;
  footTrafficScore: number;
  culturalScore: number;
}

export interface PhenomenaListResponse {
  phenomena: PhenomenonSummary[];
}

export interface PhenomenonScoreRow {
  id: string;
  phenomenonId: string;
  marketId: string;
  country: string;
  date: string;
  volume: number;
  velocity: number;
  acceleration: number;
  noiseAdjusted: number;
  sourceDiversity: number;
  compositeScore: number;
  footTrafficScore: number;
  culturalScore: number;
  footTrafficProximity: number;
  culturalProximity: number;
  linkBoost: number;
}

export interface PhenomenonLinkRow {
  id: string;
  fromPhenomenonId: string;
  toPhenomenonId: string;
  linkType: LinkType;
  weight: number;
  inferredBy: string;
  rationale: string | null;
  createdAt: string;
  supersededAt: string | null;
}

export interface PhenomenonDetail {
  id: string;
  label: string;
  description: string;
  primaryCountry: string;
  categories: string[];
  state: PhenomenonStateValue;
  phenomenonType: PhenomenonType | null;
  eventStart: string | null;
  eventEnd: string | null;
  lifecycleState: LifecycleState | null;
  culturalScope: Scope | null;
  culturalLocality: string | null;
  footTrafficScope: Scope | null;
  footTrafficLocality: string | null;
  keywords: string[];
  firstSeenAt: string;
  lastSignalAt: string;
  scores: PhenomenonScoreRow[];
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
}

export interface PhenomenonLinksResponse {
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
}

export interface SignalOfTheDay {
  id: string;
  marketId: string;
  country: string;
  date: string;
  phenomenonIds: string[];
  narrative: string;
  publishedAt: string;
}

export interface SignalOfTheDayResponse {
  signalOfTheDay: SignalOfTheDay | null;
}

export interface ReviewItemRow {
  id: string;
  marketId: string;
  phenomenonId: string;
  status: ReviewStatus;
  decision: string;
  reasons: string[];
  metricsSnapshot: Record<string, unknown>;
  narrativeDraft: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  appliedAction: string | null;
  ttlExpiresAt: string | null;
  phenomenon?: PhenomenonDetail;
}

export interface ReviewListResponse {
  items: ReviewItemRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewApproveResponse {
  reviewItemId: string;
  signalOfTheDayId: string;
}

export interface ReviewRejectResponse {
  reviewItemId: string;
}

export interface CronRunRequest {
  stages?: Array<'ingest' | 'cluster' | 'score' | 'publish'>;
  markets?: string[];
}

export interface CronRunResponse {
  enqueued: boolean;
  jobId: string | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  postgres: 'ok' | 'error' | 'unknown';
  redis: 'ok' | 'error' | 'unknown';
}

export interface ApiError {
  error: string;
  details?: unknown;
}
