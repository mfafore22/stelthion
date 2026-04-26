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

export type SourceType =
  | 'RSS'
  | 'GOOGLE_TRENDS'
  | 'REDDIT'
  | 'X'
  | 'TIKTOK'
  | 'TRADE_PUB'
  | 'STATFIN'
  | 'FRED';

export type SourceAuthority = 'authoritative' | 'opinion';

export interface ContributingSource {
  type: SourceType;
  authority: SourceAuthority;
  signalCount: number;
  lastSignalAt: string;
}

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

export interface PhenomenonLocalizedContent {
  label?: string;
  summary?: string;
  stateCommentary?: string;
  retailerImpact?: string;
  opportunity?: string;
  description?: string;
}

export type PhenomenonI18n = {
  [lang: string]: PhenomenonLocalizedContent | undefined;
};

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
  categories?: string[];
  keywords?: string[];
  recentScores?: PhenomenonScoreRow[];
  latestVelocity?: number;
  i18n?: PhenomenonI18n | null;
  contributingSources?: ContributingSource[];
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
  i18n?: PhenomenonI18n | null;
  contributingSources?: ContributingSource[];
}

export interface PhenomenonLinksResponse {
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
}

export interface SignalOfTheDayCityBlock {
  city: string;
  body: string;
}

export interface SignalOfTheDaySections {
  headline?: string;
  keyFindings?: string[];
  byCity?: SignalOfTheDayCityBlock[];
  alsoVisible?: string[];
  watching?: string[];
}

export interface SignalOfTheDayLocalizedContent {
  narrative?: string;
  sections?: SignalOfTheDaySections;
}

export type SignalOfTheDayI18n = {
  [lang: string]: SignalOfTheDayLocalizedContent | undefined;
};

export interface SignalOfTheDay {
  id: string;
  marketId: string;
  country: string;
  date: string;
  phenomenonIds: string[];
  narrative: string;
  publishedAt: string;
  i18n?: SignalOfTheDayI18n | null;
  contributingSources?: ContributingSource[];
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

export interface MarketPolicyThreshold {
  publish: number;
  review: number;
  reject: number;
}

export interface MarketPolicy {
  version: 1;
  thresholds: Record<string, MarketPolicyThreshold>;
  lifecycleModifiers?: {
    UPCOMING?: number;
    ACTIVE?: number;
    CONCLUDED?: number;
  };
}

export interface MarketConfig extends MarketDetail {
  geoAnchorLat: number | null;
  geoAnchorLon: number | null;
  policy: MarketPolicy;
}

export interface MarketConfigUpdate {
  country?: string;
  region?: string | null;
  displayName?: string;
  industryFocus?: string;
  geoAnchorLat?: number | null;
  geoAnchorLon?: number | null;
  footTrafficSubs?: string[];
  culturalSubs?: string[];
  footTrafficAxisWeight?: number;
  culturalAxisWeight?: number;
  profile?: Record<string, unknown>;
  policy?: MarketPolicy;
  active?: boolean;
}

export interface PhenomenonLinkCreate {
  toPhenomenonId: string;
  linkType: LinkType;
  weight?: number;
  rationale?: string;
  inferredBy?: string;
}

export interface ResonantMarket {
  marketId: string;
  country: string;
  compositeScore: number;
}

export interface ResonantPhenomenon {
  phenomenonId: string;
  phenomenonLabel: string | null;
  culturalScope: string | null;
  culturalLocality: string | null;
  phenomenonType: string | null;
  date: string;
  marketCount: number;
  avgCompositeScore: number;
  maxCompositeScore: number;
  markets: ResonantMarket[];
}

export interface ResonanceResponse {
  date: string;
  count: number;
  resonances: ResonantPhenomenon[];
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

export interface InsightsExportQuery {
  marketId?: string;
  since?: string;
  until?: string;
  limit?: number;
  status?: Array<'APPROVED' | 'REJECTED' | 'EXPIRED' | 'PENDING'>;
}

export type InteractionKind =
  | 'thumbs'
  | 'click'
  | 'dwell'
  | 'chat_followup'
  | 'chat_citation_click';

export interface FeedbackCreate {
  userId: string;
  marketId?: string;
  interactionKind?: InteractionKind;
  verdict: string;
  note?: string;
}

export interface InteractionRecord {
  id: string;
  phenomenonId: string;
  marketId: string | null;
  userId: string;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: string;
}

export interface InteractionSummary {
  phenomenonId: string;
  marketId: string | null;
  windowDays: number;
  totals: {
    thumbsUp: number;
    thumbsDown: number;
    clicks: number;
    dwellEvents: number;
    chatFollowups: number;
    citationClicks: number;
  };
}

export interface FeedbackRow {
  id: string;
  phenomenonId: string;
  phenomenonLabel: string;
  userId: string;
  marketId: string | null;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: string;
}

export interface FeedbackAggregate {
  phenomenonId: string;
  phenomenonLabel: string;
  relevant: number;
  notRelevant: number;
  commentCount: number;
}

export interface FeedbackListResponse {
  rows: FeedbackRow[];
  aggregates: FeedbackAggregate[];
}

export interface FeedbackListQuery {
  phenomenonId?: string;
  userId?: string;
  verdict?: string;
  marketId?: string;
  since?: string;
  limit?: number;
}

export interface MarketStatusRow {
  marketId: string;
  marketLabel: string;
  country: string;
  state: PhenomenonStateValue;
  compositeScore: number;
  velocity: number;
  lastSignalAt: string;
}

export interface MarketDivergenceVerdict {
  divergent: boolean;
  distinctStates: PhenomenonStateValue[];
  contrasts: Array<{ accelerating: string[]; fading: string[] }>;
}

export interface PhenomenonMarketsResponse {
  rows: MarketStatusRow[];
  divergence: MarketDivergenceVerdict;
}

export interface EvidenceSourceRow {
  sourceId: string;
  name: string;
  weight: number;
  type: string;
  lastSignalAt: string;
  url: string | null;
}

export interface ConfidenceComponents {
  strongSources: number;
  cadenceStability: number;
  crossMarket: number;
  recency: number;
  linkBoost: number;
}

export interface PhenomenonEvidenceResponse {
  confidence: number;
  components: ConfidenceComponents;
  strongSourceCount: number;
  totalSourceCount: number;
  crossMarketCount: number;
  sources: EvidenceSourceRow[];
}

export interface PredictedEvent {
  trendId: string;
  trendLabel: string;
  basisCount: number;
  cadenceDays: number;
  cadenceStability: number;
  expectedStart: string;
  expectedEnd: string | null;
  confidence: number;
  rationale: string;
}

export interface PredictedEventResponse {
  prediction: PredictedEvent | null;
  reason: 'not_a_trend' | 'insufficient_basis' | null;
}

export type CampaignIdeaBudget = 'light' | 'standard' | 'premium';
export type CampaignIdeaLanguage = 'fi' | 'en' | 'sv';

export interface CampaignIdeaRequest {
  language?: CampaignIdeaLanguage;
  angle?: string;
  audience?: string;
  budget?: CampaignIdeaBudget;
  durationDays?: number;
}

export interface CampaignIdea {
  phenomenonId: string;
  language: CampaignIdeaLanguage;
  angle: string;
  audience: string;
  channels: string[];
  hook: string;
  cta: string;
  successMetric: string;
  whyNow: string;
  budgetTier: CampaignIdeaBudget;
  durationDays: number;
  rationale: string;
}

export interface CampaignIdeaResponse {
  idea: CampaignIdea;
}

export interface InsightsChatRequest {
  marketId: string;
  question: string;
  topK?: number;
  windowDays?: number;
}

export interface InsightsChatCitation {
  phenomenonId: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface InsightsChatResponse {
  marketId: string;
  question: string;
  answer: string;
  citations: InsightsChatCitation[];
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
