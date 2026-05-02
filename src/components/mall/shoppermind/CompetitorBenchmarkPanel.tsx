'use client';

import { useTranslation } from 'react-i18next';
import type { MallActions, MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { SourceLinkList } from './SourceLinkList';
import { EmptyTabState } from './EmptyTabState';

export function CompetitorBenchmarkPanel({
  scenario,
  benchmarks,
}: {
  scenario: MegaScenarioResolved | null | undefined;
  benchmarks: Array<{ id: string; actions: MallActions }>;
}) {
  const { t } = useTranslation('mall');
  if (!scenario || benchmarks.length === 0) {
    return (
      <EmptyTabState
        title={t('shoppermind.competitors.emptyTitle', { defaultValue: 'Kilpailijavertailua valmistellaan' })}
        body={t('shoppermind.competitors.emptyBody', { defaultValue: 'Tälle markkinalle ei ole vielä julkaistu validoituja kilpailijaesimerkkejä.' })}
      />
    );
  }

  return (
    <section className="rounded-2xl border-2 border-bo-neutral-300/60 bg-white p-5 shadow-bo-glass">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
          {t('shoppermind.tabs.competitors', { defaultValue: 'Kilpailijat' })}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-bo-neutral-950">
          {t('shoppermind.competitors.title', { defaultValue: 'Markkinakohtaiset vertailukohteet' })}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-bo-neutral-600">
          {t('shoppermind.competitors.body', {
            defaultValue: 'Vertailut pysyvät samassa markkinassa kuin valittu näkymä. Lähteet näkyvät siellä, missä esimerkkiä käytetään.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {benchmarks.map(({ id, actions }) => (
          <article key={id} className="rounded-xl border border-bo-neutral-200 bg-bo-neutral-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-bo-neutral-950">{actions.name}</h3>
              {actions.operator && (
                <span className="rounded bg-bo-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bo-warning-dark">
                  {actions.operator}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bo-neutral-700">{actions.context}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-bo-neutral-800">
              {actions.items.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <SourceLinkList sources={scenario.sources} />
    </section>
  );
}
