import { MiniSparkline } from './MiniSparkline';
import type { MegaEvidenceChart, MegaEvidencePoint } from '@/lib/shoppermind/megaScenario';

function adaptSeries(series: MegaEvidencePoint[]) {
  return series.map((s) => ({ compositeScore: s.v }));
}

function formatValue(v: number): string {
  return new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(v);
}

export function EvidenceGraphRow({ charts, label }: { charts: MegaEvidenceChart[]; label: string }) {
  if (!charts || charts.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-2">
        {label}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {charts.map((c, i) => {
          const last = c.series[c.series.length - 1];
          const first = c.series[0];
          const delta = last && first ? last.v - first.v : 0;
          const deltaClass = delta > 0 ? 'text-bo-success' : delta < 0 ? 'text-bo-error' : 'text-bo-neutral-500';
          return (
            <div key={i} className="bo-surface-subtle rounded-lg border p-2.5">
              <div className="text-[11px] font-medium text-bo-neutral-700 leading-tight mb-1 line-clamp-2">{c.label}</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-bo-neutral-950 tabular-nums">
                  {last ? formatValue(last.v) : '–'}
                </span>
                {first && last && (
                  <span className={`text-[10px] font-medium tabular-nums ${deltaClass}`}>
                    {delta > 0 ? '+' : ''}
                    {formatValue(delta)}
                  </span>
                )}
              </div>
              {c.series.length >= 2 && (
                <MiniSparkline scores={adaptSeries(c.series) as never} height={20} />
              )}
              {first && last && (
                <div className="text-[10px] text-bo-neutral-500 mt-1 tabular-nums">
                  {first.p} → {last.p}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
