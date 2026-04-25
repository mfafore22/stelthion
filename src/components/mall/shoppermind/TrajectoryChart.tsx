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

type WindowDays = 7 | 14 | 30;

const WINDOWS: WindowDays[] = [7, 14, 30];

type SeriesKey = 'compositeScore' | 'footTrafficScore' | 'culturalScore';

const SERIES: { key: SeriesKey; labelKey: string; color: string }[] = [
  { key: 'compositeScore', labelKey: 'shoppermind.trajectory.series.composite', color: '#328d2e' },
  { key: 'footTrafficScore', labelKey: 'shoppermind.trajectory.series.footTraffic', color: '#214990' },
  { key: 'culturalScore', labelKey: 'shoppermind.trajectory.series.cultural', color: '#8B5CF6' },
];

export function TrajectoryChart({ scores }: { scores: PhenomenonScoreRow[] }) {
  const { t } = useTranslation('mall');
  const [windowDays, setWindowDays] = useState<WindowDays>(14);
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>({
    compositeScore: true,
    footTrafficScore: false,
    culturalScore: false,
  });

  const chartData = useMemo(() => {
    const sorted = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const sliced = sorted.slice(-windowDays);
    return sliced.map((s) => ({
      date: s.date.slice(5, 10),
      compositeScore: Number(s.compositeScore.toFixed(3)),
      footTrafficScore: Number(s.footTrafficScore.toFixed(3)),
      culturalScore: Number(s.culturalScore.toFixed(3)),
    }));
  }, [scores, windowDays]);

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
              key={w}
              type="button"
              onClick={() => setWindowDays(w)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                windowDays === w
                  ? 'bg-white text-bo-neutral-950 shadow-bo-sm'
                  : 'text-bo-neutral-500 hover:text-bo-neutral-800',
              )}
            >
              {t(`shoppermind.trajectory.windows.${w}d`)}
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
            label={t('shoppermind.trajectory.stats.relevance')}
            value={latest.compositeScore.toFixed(2)}
            delta={compositeDelta}
          />
          <DeltaStat
            label={t('shoppermind.trajectory.stats.velocity')}
            value={latest.velocity.toFixed(2)}
            delta={latest.velocity}
          />
          <DeltaStat
            label={t('shoppermind.trajectory.stats.acceleration')}
            value={latest.acceleration.toFixed(2)}
            delta={latest.acceleration}
          />
          <Stat
            label={t('shoppermind.trajectory.stats.volume')}
            value={latest.volume.toString()}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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
  label: string;
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
