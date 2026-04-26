'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { PhenomenonScoreRow } from '@stelthion/shoppermind-client-types';
import { cn } from '@/lib/utils';
import { MetricTerm } from './MetricTerm';

type WindowKey = '4w' | '12w' | '12m';

interface WindowSpec {
  key: WindowKey;
  days: number;
  bin: 'day' | 'week' | 'month';
}

const WINDOWS: WindowSpec[] = [
  { key: '4w', days: 28, bin: 'day' },
  { key: '12w', days: 84, bin: 'week' },
  { key: '12m', days: 365, bin: 'month' },
];

type SeriesKey = 'compositeScore' | 'footTrafficScore' | 'culturalScore';

const SERIES: { key: SeriesKey; labelKey: string; color: string }[] = [
  { key: 'compositeScore', labelKey: 'shoppermind.trajectory.series.composite', color: '#328d2e' },
  { key: 'footTrafficScore', labelKey: 'shoppermind.trajectory.series.footTraffic', color: '#214990' },
  { key: 'culturalScore', labelKey: 'shoppermind.trajectory.series.cultural', color: '#8B5CF6' },
];

function startOfIsoWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return monday;
}

function bucketKey(dateStr: string, bin: WindowSpec['bin']): string {
  const d = new Date(dateStr);
  if (bin === 'day') return dateStr.slice(0, 10);
  if (bin === 'week') return startOfIsoWeek(d).toISOString().slice(0, 10);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function formatBucketLabel(bucketIso: string, bin: WindowSpec['bin'], lang: string): string {
  if (bin === 'day') return bucketIso.slice(5);
  if (bin === 'week') return bucketIso.slice(5);
  try {
    return new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(bucketIso));
  } catch {
    return bucketIso.slice(0, 7);
  }
}

function aggregate(
  scores: PhenomenonScoreRow[],
  spec: WindowSpec,
  lang: string,
) {
  if (scores.length === 0) return [];
  const sorted = [...scores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const cutoffMs = Date.now() - spec.days * 86_400_000;
  const filtered = sorted.filter((s) => new Date(s.date).getTime() >= cutoffMs);
  if (filtered.length === 0) {
    const tail = sorted.slice(-spec.days);
    if (tail.length === 0) return [];
    return aggregate(tail, { ...spec, days: Math.max(spec.days, tail.length) }, lang);
  }
  const groups = new Map<string, PhenomenonScoreRow[]>();
  for (const s of filtered) {
    const k = bucketKey(s.date, spec.bin);
    const arr = groups.get(k);
    if (arr) arr.push(s);
    else groups.set(k, [s]);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return ordered.map(([bucket, items]) => {
    const avg = (pick: (r: PhenomenonScoreRow) => number) =>
      items.reduce((acc, r) => acc + pick(r), 0) / items.length;
    return {
      date: formatBucketLabel(bucket, spec.bin, lang),
      compositeScore: Number(avg((r) => r.compositeScore).toFixed(3)),
      footTrafficScore: Number(avg((r) => r.footTrafficScore).toFixed(3)),
      culturalScore: Number(avg((r) => r.culturalScore).toFixed(3)),
    };
  });
}

export function TrajectoryChart({ scores }: { scores: PhenomenonScoreRow[] }) {
  const { t, i18n } = useTranslation('mall');
  const [windowKey, setWindowKey] = useState<WindowKey>('12w');
  const spec = WINDOWS.find((w) => w.key === windowKey) ?? WINDOWS[1];
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>({
    compositeScore: true,
    footTrafficScore: false,
    culturalScore: false,
  });

  const chartData = useMemo(() => aggregate(scores, spec, i18n.language), [scores, spec, i18n.language]);

  const latest = scores[0] ?? null;
  const earliest = scores[scores.length - 1] ?? null;
  const compositeDelta =
    latest && earliest ? latest.compositeScore - earliest.compositeScore : 0;

  if (scores.length === 0) {
    return (
      <div className="rounded-xl bg-bo-glass border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl p-6 text-sm text-bo-neutral-500">
        {t('shoppermind.trajectory.empty')}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-bo-glass border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
            {t('shoppermind.trajectory.title')}
          </h3>
          <p className="text-xs text-bo-neutral-500 mt-0.5">
            {t('shoppermind.trajectory.subtitle')}
          </p>
        </div>
        <div className="flex gap-1 bg-bo-neutral-100 rounded-lg p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setWindowKey(w.key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                windowKey === w.key
                  ? 'bg-white text-bo-neutral-950 shadow-bo-sm'
                  : 'text-bo-neutral-500 hover:text-bo-neutral-800',
              )}
            >
              {t(`shoppermind.trajectory.windows.${w.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setEnabled((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
            className={cn(
              'inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs border transition-colors',
              enabled[s.key]
                ? 'bg-white border-bo-neutral-300 text-bo-neutral-800'
                : 'bg-transparent border-bo-neutral-200 text-bo-neutral-400',
            )}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {t(s.labelKey)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 213, 214, 0.3)" />
          <XAxis dataKey="date" stroke="#7A7A7A" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#7A7A7A"
            style={{ fontSize: '12px' }}
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(248, 246, 243, 0.95)',
              border: '1px solid rgba(212, 213, 214, 0.3)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              fontSize: '12px',
            }}
          />
          {SERIES.filter((s) => enabled[s.key]).map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              name={t(s.labelKey)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {latest && (
        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-bo-neutral-200">
          <DeltaStat
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.relevance')}>
                {t('shoppermind.trajectory.stats.relevance')}
              </MetricTerm>
            }
            value={latest.compositeScore.toFixed(2)}
            delta={compositeDelta}
          />
          <DeltaStat
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.velocity')}>
                {t('shoppermind.trajectory.stats.velocity')}
              </MetricTerm>
            }
            value={latest.velocity.toFixed(2)}
            delta={latest.velocity}
          />
          <DeltaStat
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.acceleration')}>
                {t('shoppermind.trajectory.stats.acceleration')}
              </MetricTerm>
            }
            value={latest.acceleration.toFixed(2)}
            delta={latest.acceleration}
          />
          <Stat
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.volume')}>
                {t('shoppermind.trajectory.stats.volume')}
              </MetricTerm>
            }
            value={latest.volume.toString()}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 mb-0.5">
        {label}
      </div>
      <div className="text-lg font-semibold text-bo-neutral-900">{value}</div>
    </div>
  );
}

function DeltaStat({
  label,
  value,
  delta,
}: {
  label: React.ReactNode;
  value: string;
  delta: number;
}) {
  const Icon = delta > 0.01 ? ArrowUp : delta < -0.01 ? ArrowDown : Minus;
  const color =
    delta > 0.01
      ? 'text-bo-success-dark'
      : delta < -0.01
        ? 'text-bo-warning-dark'
        : 'text-bo-neutral-400';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 mb-0.5">
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-semibold text-bo-neutral-900">{value}</span>
        <Icon className={cn('w-3.5 h-3.5', color)} />
      </div>
    </div>
  );
}
