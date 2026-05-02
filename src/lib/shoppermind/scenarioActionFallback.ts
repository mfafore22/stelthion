import type { PropertyActionsResponse } from '@stelthion/shoppermind-client-types';
import type { MallActions, MegaScenarioResolved } from './megaScenario';

export function buildScenarioActionFallback({
  scenario,
  benchmarks,
  marketId,
  country,
  trendIds,
}: {
  scenario: MegaScenarioResolved | null | undefined;
  benchmarks: Array<{ id: string; actions: MallActions }>;
  marketId: string;
  country: string;
  trendIds: string[];
}): PropertyActionsResponse | null {
  const mall = scenario?.perMall;
  if (!scenario || !mall || mall.isCompetitor || mall.items.length === 0) return null;

  const propertyId = scenario.perMallOptions.find((option) => option.name === mall.name)?.id ?? mall.name.toLowerCase();
  const sources = scenario.sources.map((source) => ({
    ...source,
    retrievedAt: scenario.updatedAt,
    sourceType: 'operator' as const,
    authorityTier: 'primary' as const,
    verificationStatus: 'verified' as const,
  }));
  const sourceIds = sources.map((source) => source.id);
  const evidenceClaims = mall.items.map((item, index) => ({
    id: `scenario-${propertyId}-claim-${index + 1}`,
    sourceId: sourceIds[index % Math.max(1, sourceIds.length)] ?? 'shoppermind-scenario',
    text: item,
    appliesTo: { marketId, propertyId, trendId: trendIds[index % Math.max(1, trendIds.length)] },
    verificationStatus: 'verified' as const,
  }));
  const primaryBenchmark = benchmarks[0]?.actions;
  const relatedTrendIds = trendIds.length > 0 ? trendIds.slice(0, 3) : ['smart-value-low-risk'];

  return {
    property: {
      id: propertyId,
      marketId,
      name: mall.name,
      operator: mall.operator ?? '',
      propertyType: 'shopping_mall',
      format: 'regional_mall',
      country,
      city: '',
      isCompetitor: false,
      summary: mall.context,
      sourceIds,
    },
    recommendations: mall.items.map((item, index) => {
      const claim = evidenceClaims[index];
      const kpi = mall.kpis?.[index % Math.max(1, mall.kpis.length)];
      return {
        id: `scenario-${propertyId}-action-${index + 1}`,
        propertyId,
        marketId,
        title: actionTitleFromText(item),
        actionType: actionTypeForIndex(index),
        priority: index === 0 ? 'high' : 'medium',
        impact: index < 2 ? 'high' : 'medium',
        effort: index % 3 === 0 ? 'low' : 'medium',
        timeHorizon: index === 0 ? 'this_week' : index < 3 ? '30_days' : '90_days',
        expectedKpi: kpi ? `${kpi.label}${kpi.target ? `: ${kpi.target}` : ''}` : 'Repeat visits, tenant participation, campaign response',
        whyNow: mall.context,
        action: item,
        relatedTrendIds,
        relatedPhenomenonIds: [],
        evidenceClaimIds: claim ? [claim.id] : [],
        competitorExamples: primaryBenchmark ? [{
          propertyId: benchmarks[0].id,
          propertyName: primaryBenchmark.name,
          operator: primaryBenchmark.operator ?? '',
          observedMove: primaryBenchmark.context,
          whyItMatters: primaryBenchmark.items[0] ?? primaryBenchmark.context,
          evidenceClaimIds: claim ? [claim.id] : [],
        }] : [],
        zoneTags: zoneTagsFromText(item),
        verificationStatus: 'verified',
      };
    }),
    evidenceClaims,
    sources,
    llmReadyContext: {
      enabled: false,
      instruction: 'Use only verified scenario claims and return citation IDs.',
      citationIds: evidenceClaims.map((claim) => claim.id),
    },
  };
}

function actionTitleFromText(text: string): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || text;
  return firstSentence.length > 82 ? `${firstSentence.slice(0, 79).trim()}...` : firstSentence;
}

function actionTypeForIndex(index: number): PropertyActionsResponse['recommendations'][number]['actionType'] {
  return (['operations', 'campaign', 'tenant_mix', 'benchmark', 'retail_media'] as const)[index % 5];
}

function zoneTagsFromText(text: string): string[] {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();
  if (/ruoka|food|ravintola|restaurant|kahvila|cafe|grocery|päivittäis/.test(normalized)) tags.add('food');
  if (/terveys|health|beauty|kauneus|wellness|apteek/.test(normalized)) tags.add('health');
  if (/screen|media|kampanja|campaign|app|loyalty|näyttö/.test(normalized)) tags.add('campaign');
  if (/palvelu|service|repair|korjaus/.test(normalized)) tags.add('services');
  if (/family|perhe|leisure|vapaa/.test(normalized)) tags.add('leisure');
  if (tags.size === 0) tags.add('mall-wide');
  return Array.from(tags);
}
