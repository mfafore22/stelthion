'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { AgentRole } from '@/lib/gcm-types';
import { useAssistantLaunch } from '@/lib/assistant-flow/useAssistantLaunch';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { PropertySegmentedSelector } from '@/components/mall/shoppermind/PropertySegmentedSelector';
import { VisualBanner } from '@/components/mall/visuals/VisualBanner';
import type { AssistantSource } from '@/lib/assistant-flow/types';
import { assistantBannerSrc } from '@/lib/shoppermind/visualTheme';
import { AssistantCommandCard } from './AssistantCommandCard';
import { AssistantControlPanel } from './AssistantControlPanel';
import { ASSISTANT_DEMOS } from './assistantCatalog';

function agentFromParam(value: string | null): AgentRole {
  return Object.values(AgentRole).includes(value as AgentRole)
    ? value as AgentRole
    : AgentRole.GENERAL_ASSISTANT;
}

function returnTargetFor(source: string | null, fallback: string) {
  if (source === 'shoppermind') return { label: 'ShopperMind', href: '/mall/shoppermind' };
  if (source === 'campaigns') return { label: fallback, href: '/mall/campaigns' };
  if (source === 'space-optimizer') return { label: fallback, href: '/mall/space-optimizer' };
  return { label: fallback, href: '/mall/assistants' };
}

function sourceFromParam(source: string | null): AssistantSource {
  if (source === 'shoppermind' || source === 'campaigns' || source === 'space-optimizer') return source;
  return 'assistants';
}

export function AssistantsView() {
  const { t } = useTranslation('mall');
  const launch = useAssistantLaunch();
  const concierge = useConciergeOptional();
  const launchedFromUrl = useRef(false);

  useEffect(() => {
    if (launchedFromUrl.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get('prompt');
    if (!prompt) return;
    launchedFromUrl.current = true;
    const source = params.get('source');
    const label = params.get('label') ?? t('assistants.title');
    launch({
      agentRole: agentFromParam(params.get('agent')),
      starterPrompt: prompt,
      viewContext: {
        kind: 'assistant',
        assistantId: params.get('source') ?? 'deep-link',
        label,
        source: sourceFromParam(source),
        returnTarget: returnTargetFor(source, label),
      },
    });
  }, [launch, t]);

  return (
    <div className="space-y-5">
      <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-6">
        <VisualBanner src={assistantBannerSrc('overview')} alt={t('assistants.title')} className="mb-5" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bo-primary-100">
              <ShieldCheck className="h-6 w-6 text-bo-primary-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">
                  {t('assistants.controlTitle')}
                </h2>
                <span className="rounded-md bg-bo-success-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bo-success-dark">
                  {t('assistants.closedEnvironment')}
                </span>
              </div>
              <p className="max-w-4xl text-sm leading-relaxed text-bo-neutral-700">
                {t('assistants.controlBody')}
              </p>
            </div>
          </div>
          {concierge && concierge.mallOptions.length > 1 && (
            <div className="w-full xl:w-[420px]">
              <PropertySegmentedSelector
                label={t('assistants.mallFocus')}
                options={concierge.mallOptions}
                value={concierge.mallId}
                onChange={concierge.setMallFocus}
              />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {ASSISTANT_DEMOS.map((item) => <AssistantCommandCard key={item.id} item={item} />)}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AssistantControlPanel type="security" />
        <AssistantControlPanel type="data" />
      </section>
    </div>
  );
}
