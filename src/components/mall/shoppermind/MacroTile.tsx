import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MiniSparkline } from './MiniSparkline';

export interface MacroTileData {
  code: string;
  name: string;
  unit: 'index' | 'percent' | 'percent-of-gdp' | 'volume-index';
  publisher: string;
  sourceUrl: string;
  latestValue: number | null;
  latestPeriod: string | null;
  fetchedAt: string | null;
  history: Array<{ period: string; value: number }>;
}

function formatValue(v: number | null, unit: MacroTileData['unit']): string {
  if (v == null) return '–';
  const fixed = unit === 'index' || unit === 'volume-index' ? 1 : 1;
  const formatted = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: fixed }).format(v);
  if (unit === 'percent' || unit === 'percent-of-gdp') return `${formatted} %`;
  return formatted;
}

function trend(history: MacroTileData['history']): number {
  if (history.length < 2) return 0;
  return history[history.length - 1].value - history[history.length - 2].value;
}

export function MacroTile({ data }: { data: MacroTileData }) {
  const { t, i18n } = useTranslation('mall');
  const delta = trend(data.history);
  const deltaClass = delta > 0 ? 'text-bo-success' : delta < 0 ? 'text-bo-error' : 'text-bo-neutral-500';
  const deltaSign = delta > 0 ? '+' : '';
  const updated = data.fetchedAt
    ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(data.fetchedAt))
    : null;
  const series = data.history.map((p) => ({ compositeScore: p.value }));
  return (
    <div className="rounded-xl border border-bo-neutral-200/60 bg-white/70 backdrop-blur-xl p-4">
      <div className="text-xs font-medium text-bo-neutral-600 mb-1 leading-snug">{data.name}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-bo-neutral-950 tabular-nums">
          {formatValue(data.latestValue, data.unit)}
        </div>
        {data.history.length >= 2 && (
          <div className={`text-xs font-medium ${deltaClass} tabular-nums`}>
            {deltaSign}{new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(delta)}
          </div>
        )}
      </div>
      <div className="text-[10px] text-bo-neutral-500 mb-2">
        {data.latestPeriod ?? t('shoppermind.macro.noData')}
      </div>
      {data.history.length >= 2 && (
        <MiniSparkline scores={series as never} height={24} />
      )}
      <div className="mt-2 pt-2 border-t border-bo-neutral-100 flex items-center justify-between text-[10px] text-bo-neutral-500">
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-bo-primary-700"
        >
          {data.publisher}
          <ExternalLink size={9} />
        </a>
        {updated && <span>{t('shoppermind.macro.updated', { date: updated })}</span>}
      </div>
    </div>
  );
}
