import { useTranslation } from 'react-i18next';
import type { CuratedTrendResolved } from '@/lib/shoppermind/megaScenario';
import { CuratedTrendCard } from './CuratedTrendCard';

interface Props {
  trends: CuratedTrendResolved[];
  mallName?: string;
}

export function CuratedTrendStrip({ trends, mallName }: Props) {
  const { t } = useTranslation('mall');
  if (!trends || trends.length === 0) return null;
  return (
    <section className="mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold text-bo-neutral-700 uppercase tracking-wider">
          {t('shoppermind.curatedTrends.label')}
        </h3>
        <span className="text-[10px] text-bo-neutral-500">
          {t('shoppermind.curatedTrends.tracked', { count: trends.length })}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {trends.map((trend) => (
          <CuratedTrendCard key={trend.id} trend={trend} mallName={mallName} />
        ))}
      </div>
    </section>
  );
}
