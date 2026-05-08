import { Lightbulb, MapPinned, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CuratedTrendResolved, MallActions, MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { EmptyTabState } from './EmptyTabState';
import { BenchmarkGrid, InfoPanel, SourceList } from './MarketLessonsBlocks';
import { PathReferenceText, type ScenarioPathId } from './PathReferenceText';

export function MarketLessonsPanel({
  scenario,
  trends,
  benchmarks,
  onSelectScenarioPath,
}: {
  scenario: MegaScenarioResolved | null;
  trends: CuratedTrendResolved[];
  benchmarks: Array<{ id: string; actions: MallActions }>;
  onSelectScenarioPath?: (pathId: ScenarioPathId) => void;
}) {
  const { t } = useTranslation('mall');
  if (!scenario && trends.length === 0) {
    return (
      <EmptyTabState
        title={t('shoppermind.marketLessons.title')}
        body={t('shoppermind.marketLessons.empty')}
      />
    );
  }

  const topTrends = trends.slice(0, 4);
  const benchmarkItems = benchmarks.flatMap((benchmark) => (
    benchmark.actions.items.slice(0, 2).map((item) => ({
      id: `${benchmark.id}-${item}`,
      name: benchmark.actions.name,
      item,
    }))
  )).slice(0, 4);
  const sourceItems = [
    ...(scenario?.sources ?? []),
    ...topTrends.flatMap((trend) => trend.sources),
  ].slice(0, 6);

  return (
    <section className="bo-surface rounded-2xl border-2 p-5">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
          {t('shoppermind.marketLessons.kicker')}
        </div>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-bo-neutral-950">
          {t('shoppermind.marketLessons.title')}
        </h2>
        <p className="mt-1 max-w-4xl text-sm leading-relaxed text-bo-neutral-600">
          {t('shoppermind.marketLessons.body')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <InfoPanel icon={MapPinned} title={t('shoppermind.marketLessons.whatChanges')}>
          <p className="text-sm leading-relaxed text-bo-neutral-700">
            <PathReferenceText
              text={scenario?.redString ?? scenario?.intro ?? t('shoppermind.marketLessons.noScenario')}
              onSelectPath={onSelectScenarioPath}
            />
          </p>
        </InfoPanel>

        <InfoPanel icon={Lightbulb} title={t('shoppermind.marketLessons.lessonsForOperator')}>
          <ul className="space-y-2 text-sm leading-relaxed text-bo-neutral-700">
            {topTrends.map((trend) => (
              <li key={trend.id} className="bo-surface-subtle rounded-lg border p-2">
                <span className="font-medium text-bo-neutral-950">{trend.label}:</span>{' '}
                <PathReferenceText text={trend.opportunities[0] ?? trend.body} onSelectPath={onSelectScenarioPath} />
              </li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel icon={ShieldCheck} title={t('shoppermind.marketLessons.evidenceConfidence')}>
          <SourceList sources={sourceItems} />
        </InfoPanel>
      </div>

      {benchmarkItems.length > 0 && (
        <div className="bo-surface-subtle mt-4 rounded-xl border p-4">
          <div className="mb-3 text-sm font-semibold text-bo-neutral-950">
            {t('shoppermind.marketLessons.benchmarkIdeas')}
          </div>
          <BenchmarkGrid items={benchmarkItems} onSelectScenarioPath={onSelectScenarioPath} />
        </div>
      )}
    </section>
  );
}
