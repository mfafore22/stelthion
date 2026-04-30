import { useTranslation } from 'react-i18next';
import type { MallKpi } from '@/lib/shoppermind/megaScenario';

const MAX_KPIS = 10;

export function MallKpiGrid({ kpis }: { kpis: MallKpi[] | undefined }) {
  const { t } = useTranslation('mall');
  if (!kpis || kpis.length === 0) return null;
  const list = kpis.slice(0, MAX_KPIS);
  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-2">
        {t('shoppermind.actions.kpisLabel')}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {list.map((k, i) => (
          <div
            key={i}
            className="rounded-lg border border-bo-neutral-200/60 bg-white/70 p-2.5 min-w-0"
          >
            <div className="text-[11px] font-medium text-bo-neutral-700 leading-snug line-clamp-2">
              {k.label}
            </div>
            {k.target && (
              <div className="mt-1">
                <span className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mr-1">
                  {t('shoppermind.actions.kpiTarget')}
                </span>
                <strong className="text-sm text-bo-neutral-950 tabular-nums">{k.target}</strong>
              </div>
            )}
            {k.hint && (
              <div className="text-[10px] text-bo-neutral-500 leading-snug mt-1">{k.hint}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
