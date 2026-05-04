import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MiniSparkline } from './MiniSparkline';
import { TrendShape } from '../ui/TrendShape';

export interface MacroTileData {
  code: string;
  slot?: string;
  name: string;
  scaleNote?: string | null;
  unit: 'index' | 'percent' | 'percent-of-gdp' | 'volume-index' | 'currency' | 'million';
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
  if (unit === 'million') return `${formatted}m`;
  if (unit === 'currency') return formatted;
  return formatted;
}

function trend(history: MacroTileData['history']): number {
  if (history.length < 2) return 0;
  return history[history.length - 1].value - history[history.length - 2].value;
}

function visualTrend(data: MacroTileData, delta: number): number {
  if (!['index', 'volume-index', 'currency', 'million'].includes(data.unit)) return delta;
  if (data.history.length < 2) return 0;
  const previous = data.history[data.history.length - 2].value;
  if (!previous) return 0;
  return (delta / Math.abs(previous)) * 100;
}

function sparklineDomain(data: MacroTileData): [number, number] | undefined {
  if (!['index', 'volume-index'].includes(data.unit) || data.history.length < 2) return undefined;
  const values = data.history.map((p) => p.value);
  const max = Math.max(...values, 1);
  return [0, Math.ceil(max * 1.08)];
}

function isDebtToGdp(data: MacroTileData): boolean {
  return data.slot === 'debt-to-gdp' || data.code.includes('debt-ratio');
}

function debtRisk(value: number | null): number {
  if (value == null) return 0;
  return Math.max(0, (value - 60) / 3);
}

function accentFor(data: MacroTileData, semanticDelta: number): string {
  if (!isDebtToGdp(data)) {
    if (semanticDelta > 0) return '#328d2e';
    if (semanticDelta < 0) return '#d4633a';
    return '#7A7674';
  }
  const value = data.latestValue;
  if (value == null) return '#7A7674';
  if (value >= 85) return '#d4633a';
  if (value >= 70) return '#b45309';
  if (value >= 60) return '#d4a017';
  return '#328d2e';
}

export function MacroTile({ data }: { data: MacroTileData }) {
  const { t, i18n } = useTranslation('mall');
  const delta = trend(data.history);
  const semanticDelta = isDebtToGdp(data) ? -delta : delta;
  const deltaClass = semanticDelta > 0 ? 'text-bo-success' : semanticDelta < 0 ? 'text-bo-error' : 'text-bo-neutral-500';
  const deltaSign = delta > 0 ? '+' : '';
  const accent = accentFor(data, semanticDelta);
  const shapeTrend = isDebtToGdp(data)
    ? debtRisk(data.latestValue)
    : visualTrend(data, delta);
  const updated = data.fetchedAt
    ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(data.fetchedAt))
    : null;
  const series = data.history.map((p) => ({ compositeScore: p.value }));
  return (
    <div
      className="bo-surface-subtle bo-surface-hover relative flex min-h-[156px] flex-col overflow-hidden rounded-xl border p-4 shadow-bo-glass"
      style={{ borderColor: `${accent}38` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, #214990)` }}
      />
      <TrendShape
        percentageChange={shapeTrend}
        intensity="background"
        color={isDebtToGdp(data) ? accent : undefined}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-1 text-xs font-medium leading-snug text-bo-neutral-600">{data.name}</div>
        {data.scaleNote && (
          <div className="mb-2 text-[10px] leading-snug text-bo-neutral-500">{data.scaleNote}</div>
        )}
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums text-bo-neutral-950">
            {formatValue(data.latestValue, data.unit)}
          </div>
          {data.history.length >= 2 && (
            <div className={`text-xs font-medium ${deltaClass} tabular-nums`}>
              {deltaSign}{new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(delta)}
            </div>
          )}
        </div>
        <div className="mb-2 text-[10px] text-bo-neutral-500">
          {data.latestPeriod ?? t('shoppermind.macro.noData')}
        </div>
        {data.history.length >= 2 ? (
          <MiniSparkline scores={series as never} height={24} yDomain={sparklineDomain(data)} />
        ) : (
          <div className="h-6 rounded bg-bo-neutral-100/70" />
        )}
        <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-bo-neutral-200/60 bg-bo-neutral-100/70 px-2.5 py-2 text-[10px] text-bo-neutral-500">
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1 hover:text-bo-primary-700"
          >
            <span className="truncate">{data.publisher}</span>
            <ExternalLink className="shrink-0" size={9} />
          </a>
          {updated && <span className="shrink-0">{t('shoppermind.macro.updated', { date: updated })}</span>}
        </div>
      </div>
    </div>
  );
}
