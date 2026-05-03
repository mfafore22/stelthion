'use client';

import { BarChart3, CheckCircle2, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentRole } from '@/lib/gcm-types';
import { useAssistantLaunch } from '@/lib/assistant-flow/useAssistantLaunch';
import { CampaignBriefBuilder, type CampaignBriefSelection } from './CampaignBriefBuilder';
import { getCampaignMallOptions } from './campaignMallOptions';

const KPI_CARDS = ['visits', 'sales', 'tenants'] as const;
const STEPS = ['brief', 'model', 'approval', 'live', 'learning'] as const;

export function CampaignsWorkspace() {
  const { t } = useTranslation('mall');
  const launch = useAssistantLaunch();
  const mallOptions = getCampaignMallOptions();
  const createBrief = (selection: CampaignBriefSelection) => launch({
    agentRole: AgentRole.EVENT_COORDINATOR,
    starterPrompt: t('campaignWorkspace.assistantPrompt', selection.labels),
    viewContext: {
      kind: 'campaign_brief',
      label: t('campaignWorkspace.title'),
      source: 'campaigns',
      payload: { values: selection.values, labels: selection.labels },
      returnTarget: { label: t('campaignWorkspace.title'), href: '/mall/campaigns' },
    },
  });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bo-primary-100">
          <Megaphone className="h-6 w-6 text-bo-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950">
            {t('campaignWorkspace.title')}
          </h1>
          <p className="text-sm text-bo-neutral-600">{t('campaignWorkspace.subtitle')}</p>
        </div>
      </div>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <CampaignBriefBuilder mallOptions={mallOptions} onCreate={createBrief} />
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {KPI_CARDS.map((kpi) => (
              <div key={kpi} className="rounded-xl border border-bo-neutral-200 bg-white p-4 shadow-bo-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-bo-neutral-500">
                  {t(`campaignWorkspace.kpis.${kpi}.label`)}
                </div>
                <div className="mt-2 text-2xl font-semibold text-bo-neutral-950">
                  {t(`campaignWorkspace.kpis.${kpi}.value`)}
                </div>
                <div className="mt-1 text-xs text-bo-neutral-500">
                  {t(`campaignWorkspace.kpis.${kpi}.hint`)}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-2 border-bo-neutral-200 bg-white p-5 shadow-bo-glass">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
              <BarChart3 size={14} />
              {t('campaignWorkspace.flowTitle')}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {STEPS.map((step, index) => (
                <div key={step} className="rounded-xl border border-bo-neutral-200 bg-bo-neutral-50 p-3">
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-bo-primary-100 text-xs font-semibold text-bo-primary-800">
                    {index + 1}
                  </div>
                  <div className="text-sm font-semibold text-bo-neutral-950">
                    {t(`campaignWorkspace.steps.${step}.title`)}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-bo-neutral-600">
                    {t(`campaignWorkspace.steps.${step}.body`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-bo-success/30 bg-bo-success-light/40 p-4 text-sm text-bo-success-dark">
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
