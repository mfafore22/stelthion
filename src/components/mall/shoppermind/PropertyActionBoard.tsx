'use client';

import { CheckCircle2, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  EvidenceClaim,
  PropertyActionRecommendation,
  PropertyActionsResponse,
} from '@stelthion/shoppermind-client-types';
import { ActionBoardAside } from './ActionBoardAside';
import { ActionCard } from './ActionCard';
import { PropertySegmentedSelector, type PropertySegmentOption } from './PropertySegmentedSelector';

function claimsForAction(action: PropertyActionRecommendation, claims: EvidenceClaim[]) {
  const ids = new Set([
    ...action.evidenceClaimIds,
    ...action.competitorExamples.flatMap((example) => example.evidenceClaimIds),
  ]);
  return claims.filter((claim) => ids.has(claim.id));
}

export function PropertyActionBoard({
  data,
  propertyOptions = [],
  selectedPropertyId = null,
  onSelectProperty,
}: {
  data: PropertyActionsResponse | null | undefined;
  propertyOptions?: PropertySegmentOption[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
}) {
  const { t } = useTranslation('mall');
  if (!data || data.recommendations.length === 0) return null;

  const verifiedShare = data.evidenceClaims.length
    ? Math.round((data.evidenceClaims.filter((claim) => claim.verificationStatus === 'verified').length / data.evidenceClaims.length) * 100)
    : 0;
  const actionLabels = {
    effort: t('shoppermind.actionBoard.effort'),
    impact: t('shoppermind.actionBoard.impact'),
    whyNow: t('shoppermind.actionBoard.whyNow'),
    expectedKpi: t('shoppermind.actionBoard.expectedKpi'),
    competitorExample: t('shoppermind.actionBoard.competitorExample'),
    noCompetitorExample: t('shoppermind.actionBoard.noCompetitorExample'),
    benchmark: t('shoppermind.actionBoard.benchmark'),
    openCampaign: t('shoppermind.actionBoard.openCampaign'),
    discussAssistant: t('shoppermind.actionBoard.discussAssistant'),
    priority: t('shoppermind.actionBoard.priority'),
    property: t('shoppermind.actionBoard.property'),
    priorityLabels: {
      critical: t('shoppermind.actionBoard.priorities.critical'),
      high: t('shoppermind.actionBoard.priorities.high'),
      medium: t('shoppermind.actionBoard.priorities.medium'),
    },
    effortLabels: {
      low: t('shoppermind.actionBoard.efforts.low'),
      medium: t('shoppermind.actionBoard.efforts.medium'),
      high: t('shoppermind.actionBoard.efforts.high'),
    },
    impactLabels: {
      low: t('shoppermind.actionBoard.impacts.low'),
      medium: t('shoppermind.actionBoard.impacts.medium'),
      high: t('shoppermind.actionBoard.impacts.high'),
    },
    timeHorizonLabels: {
      this_week: t('shoppermind.actionBoard.timeHorizons.thisWeek'),
      '30_days': t('shoppermind.actionBoard.timeHorizons.thirtyDays'),
      '90_days': t('shoppermind.actionBoard.timeHorizons.ninetyDays'),
    },
    actionTypeLabels: {
      operations: t('shoppermind.actionBoard.actionTypes.operations'),
      campaign: t('shoppermind.actionBoard.actionTypes.campaign'),
      tenant_mix: t('shoppermind.actionBoard.actionTypes.tenantMix'),
      benchmark: t('shoppermind.actionBoard.actionTypes.benchmark'),
      retail_media: t('shoppermind.actionBoard.actionTypes.retailMedia'),
    },
  };

  return (
    <section className="rounded-2xl border-2 border-bo-primary-200/70 bg-white p-5 shadow-bo-glass">
      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
            <Target size={14} />
            {t('shoppermind.actionBoard.weeklyHeader')}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-bo-neutral-950">
            {t('shoppermind.actionBoard.title', { propertyName: data.property.name })}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-bo-neutral-600">{t('shoppermind.actionBoard.subtitle')}</p>
        </div>
        <div className="w-full space-y-3 xl:w-[320px]">
          {onSelectProperty && (
            <PropertySegmentedSelector
              label={t('shoppermind.actions.selectProperty')}
              options={propertyOptions}
              value={selectedPropertyId}
              onChange={onSelectProperty}
            />
          )}
          <EvidenceMeter
            verifiedShare={verifiedShare}
            claims={data.evidenceClaims.length}
            sources={data.sources.length}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {data.recommendations.map((action) => {
            const claims = claimsForAction(action, data.evidenceClaims);
            return (
              <ActionCard
                key={action.id}
                action={action}
                claims={claims}
                sources={data.sources}
                labels={{
                  ...actionLabels,
                  showEvidence: t('shoppermind.actionBoard.showEvidence', { count: claims.length }),
                }}
                propertyName={data.property.name}
              />
            );
          })}
        </div>
        <ActionBoardAside
          actions={data.recommendations}
          labels={{
            impactVsEffort: t('shoppermind.actionBoard.impactVsEffort'),
            prioritySummary: t('shoppermind.actionBoard.prioritySummary'),
            actionCoverage: t('shoppermind.actionBoard.actionCoverage'),
            decisionContext: t('shoppermind.actionBoard.decisionContext'),
            decisionContextBody: t('shoppermind.actionBoard.decisionContextBody', {
              count: data.llmReadyContext.citationIds.length,
            }),
            priorityLabels: actionLabels.priorityLabels,
            zoneLabels: {
              food: t('shoppermind.actionBoard.zones.food'),
              health: t('shoppermind.actionBoard.zones.health'),
              campaign: t('shoppermind.actionBoard.zones.campaign'),
              services: t('shoppermind.actionBoard.zones.services'),
              leisure: t('shoppermind.actionBoard.zones.leisure'),
              'mall-wide': t('shoppermind.actionBoard.zones.mallWide'),
            },
          }}
        />
      </div>
    </section>
  );
}

function EvidenceMeter({ verifiedShare, claims, sources }: { verifiedShare: number; claims: number; sources: number }) {
  const { t } = useTranslation('mall');
  return (
    <div className="w-full rounded-lg border border-bo-neutral-200 bg-bo-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-bo-neutral-600">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-bo-success" />
          {t('shoppermind.actionBoard.verifiedEvidence')}
        </span>
        <span className="tabular-nums text-bo-neutral-950">{verifiedShare}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bo-neutral-200">
        <div className="h-full bg-bo-success" style={{ width: `${verifiedShare}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-bo-neutral-500">
        {t('shoppermind.actionBoard.evidenceSummary', { claims, sources })}
      </div>
    </div>
  );
}
