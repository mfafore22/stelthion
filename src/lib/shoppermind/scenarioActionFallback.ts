import type { PropertyActionsResponse } from '@stelthion/shoppermind-client-types';
import type { MallActions, MegaScenarioResolved } from './megaScenario';
import {
  actionTitleFromText,
  actionTypeForAction,
  actionWhyNowFromText,
  relatedTrendIdsForAction,
  zoneTagsFromText,
} from './scenarioActionFallbackText';

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
    appliesTo: {
      marketId,
      propertyId,
      trendId: relatedTrendIdsForAction(item, trendIds, index)[0],
    },
    verificationStatus: 'verified' as const,
  }));
  const primaryBenchmark = benchmarks[0]?.actions;

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
        actionType: actionTypeForAction(item, index),
        priority: index === 0 ? 'high' : 'medium',
        impact: index < 2 ? 'high' : 'medium',
        effort: index % 3 === 0 ? 'low' : 'medium',
        timeHorizon: index === 0 ? 'this_week' : index < 3 ? '30_days' : '90_days',
        expectedKpi: kpi ? `${kpi.label}${kpi.target ? `: ${kpi.target}` : ''}` : 'Repeat visits, tenant participation, campaign response',
        whyNow: actionWhyNowFromText(item, mall.context, kpi),
        action: item,
        relatedTrendIds: relatedTrendIdsForAction(item, trendIds, index),
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
