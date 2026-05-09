'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { BarChart3, CheckCircle2, Megaphone } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AgentRole } from '@/lib/gcm-types';
import { useAssistantLaunch } from '@/lib/assistant-flow/useAssistantLaunch';
import { CampaignBriefBuilder, type CampaignBriefSelection, type CampaignBuilderState, type CampaignDemoMetrics } from './CampaignBriefBuilder';
import { getCampaignMallOptions } from './campaignMallOptions';
import { PageHero } from '@/components/mall/visuals/PageHero';
import { TrendShape } from '@/components/mall/ui/TrendShape';

const KPI_CARDS = ['visits', 'sales', 'tenants'] as const;
const FALLBACK_STEPS = ['brief', 'model', 'approval', 'live', 'learning'] as const;
const CARD_ACCENTS = ['#b45309', '#214990', '#328d2e'];
const DEFAULT_METRICS: CampaignDemoMetrics = {
  visits: { value: '+3.8 %', trend: 3.8, hint: '' },
  sales: { value: '+2.4 %', trend: 2.4, hint: '' },
  tenants: { value: '0', trend: 0, hint: '' },
};
interface CampaignWorkflowStep { id: string; title: string; body: string; demoContent?: string }
interface CampaignWorkflowResponse { steps: CampaignWorkflowStep[]; baseline: { annualVisitors: number; annualSalesEur: number } }
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CampaignsWorkspace() {
  const { t, i18n } = useTranslation('mall');
  const searchParams = useSearchParams();
  const launch = useAssistantLaunch();
  const mallOptions = getCampaignMallOptions();
  const firstEnabled = mallOptions.find((option) => option.enabled);
  const initialBrief = {
    mall: searchParams.get('mall') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    stores: searchParams.get('stores')?.split(',').filter(Boolean) ?? [],
    impact: searchParams.get('impact') ?? undefined,
  };
  const [builder, setBuilder] = useState<CampaignBuilderState>({
    mallId: initialBrief.mall ?? firstEnabled?.id ?? 'realidea-sello',
    metrics: DEFAULT_METRICS,
  });
  const workflowUrl = `/api/campaigns/workflow?mallId=${encodeURIComponent(builder.mallId)}&lang=${encodeURIComponent(i18n.language)}`;
  const { data: workflow } = useSWR<CampaignWorkflowResponse>(workflowUrl, fetcher);
  const metrics = builder.metrics;
  const flowSteps: CampaignWorkflowStep[] = useMemo(() => workflow?.steps ?? FALLBACK_STEPS.map((step): CampaignWorkflowStep => ({
    id: step,
    title: t(`campaignWorkspace.steps.${step}.title`),
    body: t(`campaignWorkspace.steps.${step}.body`),
  })), [t, workflow]);

  const createBrief = async (selection: CampaignBriefSelection) => {
    const draft = await createDraft(selection, i18n.language);
    launch({
      agentRole: AgentRole.EVENT_COORDINATOR,
      starterPrompt: t('campaignWorkspace.assistantPrompt', selection.labels),
      targetMallId: selection.values.mall,
      viewContext: {
        kind: 'campaign_brief',
        label: t('campaignWorkspace.title'),
        source: 'campaigns',
        payload: { values: selection.values, labels: selection.labels, metrics, estimate: selection.estimate, draft, workflow },
        returnTarget: { label: t('campaignWorkspace.title'), href: '/mall/campaigns' },
      },
    });
  };
  return (
    <div className="space-y-5">
      <PageHero
        icon={<Megaphone className="h-6 w-6 text-bo-primary-700" />}
        title={t('campaignWorkspace.title')}
        body={t('campaignWorkspace.subtitle')}
        bannerSrc={{ title: t('campaignWorkspace.title'), primary: '#b45309', secondary: '#f3c978', accent: '#214990' }}
        bannerAlt={t('campaignWorkspace.title')}
      />
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-3">
          <CampaignBriefBuilder
            mallOptions={mallOptions}
            initialSelection={initialBrief}
            onSelectionChange={setBuilder}
            onCreate={createBrief}
          />
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {KPI_CARDS.map((kpi, index) => {
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              return (
                <div
                  key={kpi}
                  className="bo-surface-subtle bo-surface-hover relative min-h-[128px] overflow-hidden rounded-xl border-2 px-4 pb-3 pt-4 shadow-bo-glass"
                  style={{ borderColor: `${accent}38` }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${accent}, #f3c978)` }}
                  />
                  <TrendShape percentageChange={metrics[kpi].trend} intensity="background" />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bo-neutral-500">
                      {t(`campaignWorkspace.kpis.${kpi}.label`)}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-bo-neutral-950">
                      {metrics[kpi].value || t(`campaignWorkspace.kpis.${kpi}.value`)}
                    </div>
                    <div className="mt-auto rounded-lg border border-bo-neutral-200/60 bg-bo-neutral-100/70 px-3 py-2 text-xs leading-snug text-bo-neutral-600">
                      {metrics[kpi].hint || t(`campaignWorkspace.kpis.${kpi}.hint`)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bo-surface bo-surface-hover rounded-2xl border-2 border-bo-primary-200/60 p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
              <BarChart3 size={14} />
              {t('campaignWorkspace.flowTitle')}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {flowSteps.map((step, index) => {
                const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                return (
                  <div
                    key={step.id}
                    className="bo-surface-subtle bo-surface-hover relative min-h-[154px] overflow-hidden rounded-xl border p-3 shadow-bo-glass"
                    style={{ borderColor: `${accent}38` }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${accent}, #f3c978)` }}
                    />
                    <TrendShape percentageChange={index === 0 ? 4 : 0} intensity="background" />
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-bo-neutral-950 text-xs font-semibold text-white shadow-bo-sm">
                        {index + 1}
                      </div>
                      <div className="text-sm font-semibold text-bo-neutral-950">
                        {step.title}
                      </div>
                      <div className="mt-auto rounded-lg border border-bo-neutral-200/60 bg-bo-neutral-100/70 px-2.5 py-2 text-xs leading-relaxed text-bo-neutral-600">
                        {step.body}
                      </div>
                      {step.demoContent ? (
                        <div className="mt-2 text-[11px] font-medium leading-snug text-bo-primary-700">
                          {step.demoContent}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bo-surface-subtle bo-surface-hover rounded-xl border border-bo-success/30 bg-bo-success-light/40 p-4 text-sm text-bo-success-dark shadow-bo-glass">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} />
              {t('campaignWorkspace.aiTitle')}
            </div>
            <p className="leading-relaxed">{t('campaignWorkspace.aiBody')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function createDraft(selection: CampaignBriefSelection, language: string) {
  const body = {
    mallId: selection.values.mall,
    zone: selection.values.zone,
    audience: selection.values.audience,
    category: selection.values.category,
    stores: selection.values.stores.split('|').filter(Boolean),
    budget: selection.values.budget,
    duration: selection.values.duration,
    impact: selection.values.impact,
  };
  try {
    const res = await fetch(`/api/campaigns/brief?lang=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.draft ?? null;
  } catch {
    return null;
  }
}
