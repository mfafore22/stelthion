export type VerificationStatus = 'verified' | 'needs_rewrite' | 'unsupported' | 'retired';
export type EvidenceSourceType = 'official' | 'statistical' | 'operator' | 'research' | 'trade';
export type EvidenceAuthorityTier = 'primary' | 'trusted_research' | 'trade_reference';
export type ActionPriority = 'critical' | 'high' | 'medium';
export type ActionEffort = 'low' | 'medium' | 'high';
export type ActionImpact = 'low' | 'medium' | 'high';
export type ActionTimeHorizon = 'this_week' | '30_days' | '90_days';

export interface PropertyProfile {
  id: string;
  marketId: string;
  name: string;
  operator: string;
  propertyType: 'shopping_mall';
  format: 'transit_hub' | 'regional_mall' | 'destination_mall' | 'urban_mall';
  country: string;
  city: string;
  isCompetitor: boolean;
  summary: string;
  sourceIds: string[];
}

export interface VerifiedEvidenceSource {
  id: string;
  publisher: string;
  title: string;
  url: string;
  retrievedAt: string;
  sourceType: EvidenceSourceType;
  authorityTier: EvidenceAuthorityTier;
  verificationStatus: VerificationStatus;
}

export interface EvidenceClaim {
  id: string;
  sourceId: string;
  text: string;
  metricValue?: number;
  metricUnit?: string;
  appliesTo: {
    marketId?: string;
    propertyId?: string;
    trendId?: string;
  };
  verificationStatus: VerificationStatus;
}

export interface CompetitorExample {
  propertyId: string;
  propertyName: string;
  operator: string;
  observedMove: string;
  whyItMatters: string;
  evidenceClaimIds: string[];
}

export interface PropertyActionRecommendation {
  id: string;
  propertyId: string;
  marketId: string;
  title: string;
  actionType: 'tenant_mix' | 'campaign' | 'operations' | 'benchmark' | 'retail_media';
  priority: ActionPriority;
  impact: ActionImpact;
  effort: ActionEffort;
  timeHorizon: ActionTimeHorizon;
  expectedKpi: string;
  whyNow: string;
  action: string;
  relatedTrendIds: string[];
  relatedPhenomenonIds: string[];
  evidenceClaimIds: string[];
  competitorExamples: CompetitorExample[];
  zoneTags: string[];
  verificationStatus: VerificationStatus;
}

export interface PropertyActionsResponse {
  property: PropertyProfile;
  recommendations: PropertyActionRecommendation[];
  evidenceClaims: EvidenceClaim[];
  sources: VerifiedEvidenceSource[];
  llmReadyContext: {
    enabled: false;
    instruction: string;
    citationIds: string[];
  };
}

const SOURCES: VerifiedEvidenceSource[] = [
  {
    id: 'stat-fi-confidence-apr-2026',
    publisher: 'Statistics Finland',
    title: 'Consumer confidence, April 2026',
    url: 'https://stat.fi/en/statistics/kbar',
    retrievedAt: '2026-05-01',
    sourceType: 'statistical',
    authorityTier: 'primary',
    verificationStatus: 'verified',
  },
  {
    id: 'capgemini-consumer-2026',
    publisher: 'Capgemini Research Institute',
    title: "What matters to today's consumer 2026",
    url: 'https://www.capgemini.com/insights/research-library/what-matters-to-todays-consumer-2026/',
    retrievedAt: '2026-05-01',
    sourceType: 'research',
    authorityTier: 'trusted_research',
    verificationStatus: 'verified',
  },
  {
    id: 'niq-consumer-outlook-2026',
    publisher: 'NIQ',
    title: 'Consumer Outlook: Guide to 2026',
    url: 'https://nielseniq.com/global/en/insights/report/2025/consumer-outlook-guide-to-2026/',
    retrievedAt: '2026-05-01',
    sourceType: 'research',
    authorityTier: 'trusted_research',
    verificationStatus: 'verified',
  },
  {
    id: 'nepa-fmcg-2026',
    publisher: 'Nepa',
    title: 'FMCG & Consumer Goods Marketing 2026',
    url: 'https://nepa.com/a-2026-trend-report-for-nordic-fmcg-consumer-goods-leaders/',
    retrievedAt: '2026-05-01',
    sourceType: 'research',
    authorityTier: 'trusted_research',
    verificationStatus: 'verified',
  },
  {
    id: 'sello-official',
    publisher: 'Sello',
    title: 'Sello Shopping Centre',
    url: 'https://www.sello.fi/en',
    retrievedAt: '2026-05-01',
    sourceType: 'operator',
    authorityTier: 'primary',
    verificationStatus: 'verified',
  },
  {
    id: 'tripla-official',
    publisher: 'Mall of Tripla',
    title: 'Mall of Tripla',
    url: 'https://malloftripla.fi/en',
    retrievedAt: '2026-05-01',
    sourceType: 'operator',
    authorityTier: 'primary',
    verificationStatus: 'verified',
  },
  {
    id: 'mall-of-america-about',
    publisher: 'Mall of America',
    title: 'About Mall of America',
    url: 'https://www.mallofamerica.com/about',
    retrievedAt: '2026-05-01',
    sourceType: 'operator',
    authorityTier: 'primary',
    verificationStatus: 'verified',
  },
  {
    id: 'mall-of-america-flagship-2025',
    publisher: 'Mall of America',
    title: 'Mall of America highlights the power of flagship stores',
    url: 'https://www.mallofamerica.com/press-release/28485',
    retrievedAt: '2026-05-01',
    sourceType: 'operator',
    authorityTier: 'primary',
    verificationStatus: 'verified',
  },
];

const PROPERTIES: PropertyProfile[] = [
  {
    id: 'realidea-tripla',
    marketId: 'helsinki-fi',
    name: 'Mall of Tripla',
    operator: 'Realidea demo portfolio',
    propertyType: 'shopping_mall',
    format: 'transit_hub',
    country: 'FI',
    city: 'Helsinki',
    isCompetitor: false,
    summary: 'Transit-led mixed-use shopping centre with grocery, services, food, entertainment, and commuter missions.',
    sourceIds: ['tripla-official'],
  },
  {
    id: 'realidea-sello',
    marketId: 'helsinki-fi',
    name: 'Sello',
    operator: 'Realidea demo portfolio',
    propertyType: 'shopping_mall',
    format: 'regional_mall',
    country: 'FI',
    city: 'Espoo',
    isCompetitor: false,
    summary: 'Regional everyday-life centre with a broad retail, service, health, beauty, and leisure mix.',
    sourceIds: ['sello-official'],
  },
  {
    id: 'mall-of-america',
    marketId: 'newyork-us',
    name: 'Mall of America',
    operator: 'Triple Five Group',
    propertyType: 'shopping_mall',
    format: 'destination_mall',
    country: 'US',
    city: 'Bloomington',
    isCompetitor: true,
    summary: 'Large destination retail and entertainment benchmark for flagship, attraction, and tourist-led shopping.',
    sourceIds: ['mall-of-america-about', 'mall-of-america-flagship-2025'],
  },
];

const CLAIMS: EvidenceClaim[] = [
  {
    id: 'claim-fi-confidence-apr-2026',
    sourceId: 'stat-fi-confidence-apr-2026',
    text: 'Statistics Finland reported a consumer confidence indicator of -12.5 for April 2026.',
    metricValue: -12.5,
    metricUnit: 'balance figure',
    appliesTo: { marketId: 'helsinki-fi', trendId: 'smart-value-low-risk' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-capgemini-value-2026',
    sourceId: 'capgemini-consumer-2026',
    text: 'Capgemini describes value perception as increasingly shaped by transparent pricing, quality, trust, emotional connection, and AI-enabled shopping tools.',
    appliesTo: { trendId: 'smart-value-low-risk' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-niq-retail-media-2026',
    sourceId: 'niq-consumer-outlook-2026',
    text: 'NIQ identifies retail media networks and seamless commerce as core 2026 retail growth themes.',
    appliesTo: { trendId: 'retail-media-and-mall-attention' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-niq-health-beauty-growth',
    sourceId: 'niq-consumer-outlook-2026',
    text: 'NIQ reports Health & Beauty as a stronger engagement area in its 2026 consumer outlook, with more frequent shopping occasions in leading markets.',
    appliesTo: { trendId: 'health-beauty-wellness-frequency' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-nepa-nordic-health-retail-media',
    sourceId: 'nepa-fmcg-2026',
    text: 'Nepa frames value, health, retail media, AI-mediated discovery, and evidence-based category growth as linked Nordic FMCG priorities for 2026.',
    appliesTo: { trendId: 'health-beauty-wellness-frequency' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-sello-160-stores',
    sourceId: 'sello-official',
    text: 'Sello states that it has more than 160 shops and a broad range including leisure, health, and beauty.',
    metricValue: 160,
    metricUnit: 'shops',
    appliesTo: { propertyId: 'realidea-sello' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-tripla-public-areas',
    sourceId: 'tripla-official',
    text: 'Mall of Tripla publishes 24-hour public-area access and broad shop, service, cafe, restaurant, parking, and hotel information.',
    appliesTo: { propertyId: 'realidea-tripla' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-moa-flagship-visitors',
    sourceId: 'mall-of-america-flagship-2025',
    text: 'Mall of America says it provides flagship brands a platform with more than 32 million annual visitors.',
    metricValue: 32,
    metricUnit: 'million annual visitors',
    appliesTo: { propertyId: 'mall-of-america' },
    verificationStatus: 'verified',
  },
  {
    id: 'claim-moa-flagship-experience',
    sourceId: 'mall-of-america-flagship-2025',
    text: 'Mall of America positions flagship locations as immersive brand experiences with exclusive assortments, interactive elements, and innovation.',
    appliesTo: { propertyId: 'mall-of-america', trendId: 'curated-discretionary' },
    verificationStatus: 'verified',
  },
];

const BASE_RECOMMENDATIONS: PropertyActionRecommendation[] = [
  {
    id: 'tripla-weekly-value-proof',
    propertyId: 'realidea-tripla',
    marketId: 'helsinki-fi',
    title: 'Launch a weekly proof-of-value route',
    actionType: 'campaign',
    priority: 'critical',
    impact: 'high',
    effort: 'medium',
    timeHorizon: 'this_week',
    expectedKpi: 'Repeat visits, grocery-to-food conversion, average basket',
    whyNow: 'Finnish consumer confidence is weak, but shoppers still respond to transparent, useful value rather than generic discounting.',
    action: 'Create one visible route through grocery, pharmacy/health, food, and everyday services with clear price promises, return/warranty cues, and app/screen promotion.',
    relatedTrendIds: ['smart-value-low-risk', 'frictionless-omnichannel'],
    relatedPhenomenonIds: [],
    evidenceClaimIds: ['claim-fi-confidence-apr-2026', 'claim-capgemini-value-2026', 'claim-tripla-public-areas'],
    competitorExamples: [
      {
        propertyId: 'realidea-sello',
        propertyName: 'Sello',
        operator: 'Realidea demo portfolio',
        observedMove: 'Use Sello as a regional everyday-service benchmark with broad health, beauty, leisure, and retail breadth.',
        whyItMatters: 'A transit-led centre can borrow the everyday-service clarity while keeping a faster commuter mission.',
        evidenceClaimIds: ['claim-sello-160-stores'],
      },
    ],
    zoneTags: ['grocery', 'food', 'health', 'services'],
    verificationStatus: 'verified',
  },
  {
    id: 'tripla-retail-media-pilot',
    propertyId: 'realidea-tripla',
    marketId: 'helsinki-fi',
    title: 'Package screens and app slots as a retail-media pilot',
    actionType: 'retail_media',
    priority: 'high',
    impact: 'high',
    effort: 'medium',
    timeHorizon: '30_days',
    expectedKpi: 'Campaign sell-through, tenant participation, coupon redemptions',
    whyNow: 'Retail media and AI-mediated discovery are becoming part of how shoppers find products and how brands buy attention.',
    action: 'Offer three tenant-funded campaign packages: launch, weekly value, and commuter impulse. Each package must include screen placement, app placement, tenant landing page, and redemption reporting.',
    relatedTrendIds: ['retail-media-and-mall-attention', 'frictionless-omnichannel'],
    relatedPhenomenonIds: [],
    evidenceClaimIds: ['claim-niq-retail-media-2026', 'claim-nepa-nordic-health-retail-media'],
    competitorExamples: [
      {
        propertyId: 'mall-of-america',
        propertyName: 'Mall of America',
        operator: 'Triple Five Group',
        observedMove: 'Use flagship stores as immersive media and launch environments, not just leases.',
        whyItMatters: 'The same logic scales down: mall-owned attention inventory can become a measurable product for tenants.',
        evidenceClaimIds: ['claim-moa-flagship-visitors', 'claim-moa-flagship-experience'],
      },
    ],
    zoneTags: ['screens', 'app', 'tenant-marketing', 'retail-media'],
    verificationStatus: 'verified',
  },
  {
    id: 'tripla-wellness-frequency-cluster',
    propertyId: 'realidea-tripla',
    marketId: 'helsinki-fi',
    title: 'Build a wellness-frequency cluster around everyday services',
    actionType: 'tenant_mix',
    priority: 'high',
    impact: 'medium',
    effort: 'high',
    timeHorizon: '90_days',
    expectedKpi: 'Health/beauty visits, service dwell, appointment-led repeat visits',
    whyNow: 'Health, beauty, and wellness are recurring missions that can lift frequency when discretionary retail is more selective.',
    action: 'Bundle pharmacy-adjacent services, beauty, fitness, diagnostics/pop-up clinics, and lighter food into a visible cluster with appointment prompts and rest points.',
    relatedTrendIds: ['health-beauty-wellness-frequency', 'service-led-ageing'],
    relatedPhenomenonIds: [],
    evidenceClaimIds: ['claim-niq-health-beauty-growth', 'claim-nepa-nordic-health-retail-media'],
    competitorExamples: [
      {
        propertyId: 'realidea-sello',
        propertyName: 'Sello',
        operator: 'Realidea demo portfolio',
        observedMove: 'Benchmark Sello for broad health, beauty, leisure, and everyday service mix.',
        whyItMatters: 'Tripla should make the service layer more legible and commuter-friendly rather than only adding tenants.',
        evidenceClaimIds: ['claim-sello-160-stores'],
      },
    ],
    zoneTags: ['health', 'beauty', 'wellness', 'accessibility'],
    verificationStatus: 'verified',
  },
  {
    id: 'sello-service-frequency',
    propertyId: 'realidea-sello',
    marketId: 'helsinki-fi',
    title: 'Turn service breadth into a weekly habit program',
    actionType: 'operations',
    priority: 'high',
    impact: 'high',
    effort: 'medium',
    timeHorizon: '30_days',
    expectedKpi: 'Weekly active loyalty users, service visit share, repeat visits',
    whyNow: 'Sello already has the breadth to be used as an everyday-life platform; the demo opportunity is making that breadth measurable and shoppable.',
    action: 'Create weekly service missions: health/beauty, repair, family errands, food, and leisure. Promote each as a one-hour route with source-backed rationale and tenant offers.',
    relatedTrendIds: ['service-led-ageing', 'smart-value-low-risk', 'health-beauty-wellness-frequency'],
    relatedPhenomenonIds: [],
    evidenceClaimIds: ['claim-sello-160-stores', 'claim-niq-health-beauty-growth', 'claim-capgemini-value-2026'],
    competitorExamples: [
      {
        propertyId: 'mall-of-america',
        propertyName: 'Mall of America',
        operator: 'Triple Five Group',
        observedMove: 'Treat attraction, retail, and brand experience as one visit system.',
        whyItMatters: 'Sello can apply the same system thinking locally through services and weekly routines.',
        evidenceClaimIds: ['claim-moa-flagship-experience'],
      },
    ],
    zoneTags: ['services', 'health', 'family', 'loyalty'],
    verificationStatus: 'verified',
  },
];

function byPriority(a: PropertyActionRecommendation, b: PropertyActionRecommendation): number {
  const rank: Record<ActionPriority, number> = { critical: 0, high: 1, medium: 2 };
  return rank[a.priority] - rank[b.priority];
}

export function listVerifiedSources(): VerifiedEvidenceSource[] {
  return SOURCES.filter((s) => s.verificationStatus === 'verified');
}

export function listVerifiedClaims(): EvidenceClaim[] {
  return CLAIMS.filter((c) => c.verificationStatus === 'verified');
}

export function getPropertyProfile(propertyId: string): PropertyProfile | null {
  return PROPERTIES.find((p) => p.id === propertyId) ?? null;
}

export function getPropertyActions(
  propertyId: string,
  marketId?: string,
): PropertyActionsResponse | null {
  const property = getPropertyProfile(propertyId);
  if (!property) return null;
  if (marketId && property.marketId !== marketId) return null;

  const recommendations = BASE_RECOMMENDATIONS
    .filter((r) => r.propertyId === propertyId && r.marketId === property.marketId)
    .filter((r) => r.verificationStatus === 'verified')
    .sort(byPriority);

  const claimIds = new Set<string>();
  const sourceIds = new Set<string>(property.sourceIds);
  for (const rec of recommendations) {
    for (const id of rec.evidenceClaimIds) claimIds.add(id);
    for (const competitor of rec.competitorExamples) {
      for (const id of competitor.evidenceClaimIds) claimIds.add(id);
    }
  }

  const evidenceClaims = listVerifiedClaims().filter((claim) => {
    const keep = claimIds.has(claim.id);
    if (keep) sourceIds.add(claim.sourceId);
    return keep;
  });
  const sources = listVerifiedSources().filter((source) => sourceIds.has(source.id));

  return {
    property,
    recommendations,
    evidenceClaims,
    sources,
    llmReadyContext: buildPropertyActionLLMContext(recommendations, evidenceClaims),
  };
}

export function buildPropertyActionLLMContext(
  recommendations: PropertyActionRecommendation[],
  claims: EvidenceClaim[],
): PropertyActionsResponse['llmReadyContext'] {
  const verifiedClaimIds = new Set(
    claims.filter((claim) => claim.verificationStatus === 'verified').map((claim) => claim.id),
  );
  const citationIds = Array.from(
    new Set(
      recommendations.flatMap((rec) => [
        ...rec.evidenceClaimIds,
        ...rec.competitorExamples.flatMap((example) => example.evidenceClaimIds),
      ]),
    ),
  ).filter((id) => verifiedClaimIds.has(id));

  return {
    enabled: false,
    citationIds,
    instruction:
      'LLM narration is disabled for the MVP. When enabled, summarize only recommendations and verified evidence claim IDs supplied in this payload; cite claim IDs explicitly.',
  };
}
