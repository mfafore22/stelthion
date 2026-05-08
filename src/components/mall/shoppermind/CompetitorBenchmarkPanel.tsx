'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import type { MallActions, MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { SourceLinkList } from './SourceLinkList';
import { EmptyTabState } from './EmptyTabState';
import { PathReferenceText, type ScenarioPathId } from './PathReferenceText';
import { VisualBanner } from '@/components/mall/visuals/VisualBanner';
import { competitorLogoSrc, sectionBannerSrc } from '@/lib/shoppermind/visualTheme';

export function CompetitorBenchmarkPanel({
  scenario,
  benchmarks,
  onSelectScenarioPath,
}: {
  scenario: MegaScenarioResolved | null | undefined;
  benchmarks: Array<{ id: string; actions: MallActions }>;
  onSelectScenarioPath?: (pathId: ScenarioPathId) => void;
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
    <section className="bo-surface rounded-2xl border-2 p-5">
      <VisualBanner
        src={sectionBannerSrc('competitors')}
        alt={t('shoppermind.tabs.competitors', { defaultValue: 'Kilpailijat' })}
        className="mb-5"
      />
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
          <article key={id} className="bo-surface-subtle bo-surface-hover rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-bo-neutral-950">{actions.name}</h3>
                {actions.operator && (
                  <span className="rounded bg-bo-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bo-warning-dark">
                    {actions.operator}
                  </span>
                )}
              </div>
              <CompetitorLogo name={actions.name} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bo-neutral-700">
              <PathReferenceText text={actions.context} onSelectPath={onSelectScenarioPath} />
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-bo-neutral-800">
              {actions.items.slice(0, 5).map((item, index) => (
                <li key={index}>
                  <PathReferenceText text={item} onSelectPath={onSelectScenarioPath} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <SourceLinkList sources={scenario.sources} />
    </section>
  );
}

function CompetitorLogo({ name }: { name: string }) {
  const src = competitorLogoSrc(name);
  if (!src) return null;
  return <Image src={src} alt={name} width={96} height={32} className="h-8 w-auto object-contain opacity-90" />;
}
