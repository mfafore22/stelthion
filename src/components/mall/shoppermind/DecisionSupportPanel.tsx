'use client';

import { useTranslation } from 'react-i18next';
import type { PropertyActionsResponse } from '@stelthion/shoppermind-client-types';
import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { VisualBanner } from '@/components/mall/visuals/VisualBanner';
import { sectionBannerSrc } from '@/lib/shoppermind/visualTheme';

export function DecisionSupportPanel({
  scenario,
  actions,
  trendCount,
}: {
  scenario: MegaScenarioResolved | null | undefined;
  actions: PropertyActionsResponse | null | undefined;
  trendCount: number;
}) {
  const { t } = useTranslation('mall');
  const sourceCount = new Set([
    ...(scenario?.sources.map((source) => source.id) ?? []),
    ...(actions?.sources.map((source) => source.id) ?? []),
  ]).size;
  const claimCount = actions?.evidenceClaims.length ?? 0;

  return (
    <section className="bo-surface rounded-2xl border-2 p-5">
      <VisualBanner
        src={sectionBannerSrc('decision')}
        alt={t('shoppermind.tabs.decisionSupport', { defaultValue: 'Päätöksen tuki' })}
        className="mb-5"
      />
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
          {t('shoppermind.tabs.decisionSupport', { defaultValue: 'Päätöksen tuki' })}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-bo-neutral-950">
          {t('shoppermind.decisionSupport.title', { defaultValue: 'Miksi nämä suositukset ovat perusteltuja' })}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-bo-neutral-600">
          {t('shoppermind.decisionSupport.body')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SupportBlock
          title={t('shoppermind.decisionSupport.logicTitle')}
          items={[
            t('shoppermind.decisionSupport.logicTrend', { count: trendCount }),
            t('shoppermind.decisionSupport.logicScenario'),
            t('shoppermind.decisionSupport.logicProperty'),
          ]}
        />
        <SupportBlock
          title={t('shoppermind.decisionSupport.usedTitle')}
          items={[
            t('shoppermind.decisionSupport.usedSources', { count: sourceCount }),
            t('shoppermind.decisionSupport.usedClaims', { count: claimCount }),
            t('shoppermind.decisionSupport.usedEvidence'),
          ]}
        />
        <SupportBlock
          title={t('shoppermind.decisionSupport.missingTitle')}
          items={[
            t('shoppermind.decisionSupport.missingSales'),
            t('shoppermind.decisionSupport.missingFootfall'),
            t('shoppermind.decisionSupport.missingBudget'),
          ]}
        />
      </div>

      <div className="bo-surface-subtle mt-5 rounded-xl border border-bo-primary-200 p-4">
        <h3 className="text-sm font-semibold text-bo-neutral-950">{t('shoppermind.decisionSupport.aiTitle')}</h3>
        <p className="mt-1 max-w-4xl text-sm leading-relaxed text-bo-neutral-700">
          {t('shoppermind.decisionSupport.aiBody')}
        </p>
      </div>
    </section>
  );
}

function SupportBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bo-surface-subtle rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-bo-neutral-950">{title}</h3>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-bo-neutral-700">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
