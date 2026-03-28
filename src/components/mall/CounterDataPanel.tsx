'use client';

import { useState } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface HourlyEntry {
  hour: number;
  visitors: number;
  prevYear: number | null;
  year2: number | null;
  year3: number | null;
}

interface DailyEntry {
  date: string;
  visitors: number;
  visitorsPrevYear: number | null;
  estimated?: boolean;
  hourlyData?: HourlyEntry[];
}

interface CounterInfo {
  label: string;
  floor: string;
  granularity: string;
  dailyData: DailyEntry[];
  weekTotal: number;
  weekTotalPrevYear: number | null;
  deltaPercent: number | null;
}

interface Props {
  counter: CounterInfo;
  week: number;
  year: number;
  mallId: string;
  onClose: () => void;
}

const YEAR_COLORS = [
  'var(--color-bo-primary-600, #328d2e)',  // current year
  'var(--color-bo-accent-600, #3b82f6)',   // year - 1
  '#e8b931',                                // year - 2
  'var(--color-bo-neutral-400, #9ca3af)',   // year - 3
];

export function CounterDataPanel({ counter, week, year, mallId, onClose }: Props) {
  // Determine available years from hourly data
  const hasHourly = counter.granularity === 'hourly' && counter.dailyData[0]?.hourlyData?.length;
  const hourlyData = hasHourly ? counter.dailyData[0].hourlyData! : [];

  const hasYear1 = hourlyData.some((h) => h.prevYear != null);
  const hasYear2 = hourlyData.some((h) => h.year2 != null);
  const hasYear3 = hourlyData.some((h) => h.year3 != null);

  const availableYears: { key: string; label: string; available: boolean }[] = [
    { key: 'current', label: `${year}`, available: true },
    { key: 'prevYear', label: `${year - 1}`, available: hasYear1 },
    { key: 'year2', label: `${year - 2}`, available: hasYear2 },
    { key: 'year3', label: `${year - 3}`, available: hasYear3 },
  ].filter((y) => y.available);

  // Year toggle state — current year always on, user can toggle comparison years
  const [enabledYears, setEnabledYears] = useState<Set<string>>(
    new Set(availableYears.length >= 2 ? ['current', 'prevYear'] : ['current']),
  );

  const toggleYear = (key: string) => {
    setEnabledYears((prev) => {
      const next = new Set(prev);
      if (key === 'current') return next; // can't disable current
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build hourly chart data
  const hourlyChartData = hasHourly
    ? hourlyData.map((h) => ({
        hour: `${h.hour}:00`,
        current: h.visitors,
        prevYear: h.prevYear ?? 0,
        year2: h.year2 ?? 0,
        year3: h.year3 ?? 0,
      }))
    : [];

  // Build daily chart data (fallback for non-hourly)
  const DAY_NAMES = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
  const dailyChartData = counter.dailyData.map((d, i) => ({
    day: DAY_NAMES[i] ?? d.date.slice(8),
    current: d.visitors,
    prevYear: d.visitorsPrevYear ?? 0,
  }));

  // Day total for hourly data
  const dayTotal = hasHourly ? hourlyData.reduce((s, h) => s + h.visitors, 0) : counter.weekTotal;
  const dayTotalPrev = hasHourly
    ? (hasYear1 ? hourlyData.reduce((s, h) => s + (h.prevYear ?? 0), 0) : null)
    : counter.weekTotalPrevYear;
  const dayTotalYear2 = hasHourly && hasYear2
    ? hourlyData.reduce((s, h) => s + (h.year2 ?? 0), 0)
    : null;
  const dayTotalYear3 = hasHourly && hasYear3
    ? hourlyData.reduce((s, h) => s + (h.year3 ?? 0), 0)
    : null;

  const deltaVsPrev = dayTotalPrev && dayTotalPrev > 0
    ? Math.round(((dayTotal - dayTotalPrev) / dayTotalPrev) * 1000) / 10
    : null;
  const isPositive = (deltaVsPrev ?? 0) >= 0;

  const handleExport = () => {
    window.open(
      `/api/counters/${mallId}/export?week=${week}&year=${year}&format=csv&counter=${encodeURIComponent(counter.label)}`,
    );
  };

  const reportDate = counter.dailyData[0]?.date ?? '';

  return (
    <div className="border-t border-bo-primary-100/40 bg-bo-glass-primary px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-bo-primary-600" />
          <span className="text-sm font-semibold text-bo-neutral-950">{counter.label}</span>
          <span className="text-[10px] text-bo-neutral-400 font-medium uppercase">
            {counter.floor === 'upper' ? 'Yläkerta' : 'Alakerta'}
          </span>
          {hasHourly && (
            <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-medium">
              tuntidata
            </span>
          )}
          {counter.granularity === 'weekly' && (
            <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">
              est.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg hover:bg-bo-neutral-100 text-bo-neutral-500 hover:text-bo-neutral-700 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-bo-neutral-300 hover:text-bo-neutral-500 transition-colors"
            aria-label="Sulje"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      </div>

      {/* Date + totals per year */}
      {reportDate && (
        <p className="text-[10px] text-bo-neutral-400 font-medium mb-2">{reportDate}</p>
      )}
      <div className="flex flex-wrap gap-4 mb-3">
        <div>
          <p className="text-[10px] text-bo-neutral-500 font-medium">{year}</p>
          <p className="text-lg font-bold text-bo-neutral-950">{dayTotal.toLocaleString()}</p>
        </div>
        {dayTotalPrev != null && (
          <div>
            <p className="text-[10px] text-bo-neutral-500 font-medium">{year - 1}</p>
            <p className="text-lg font-bold text-bo-neutral-400">{dayTotalPrev.toLocaleString()}</p>
          </div>
        )}
        {dayTotalYear2 != null && (
          <div>
            <p className="text-[10px] text-bo-neutral-500 font-medium">{year - 2}</p>
            <p className="text-lg font-bold" style={{ color: '#e8b931' }}>{dayTotalYear2.toLocaleString()}</p>
          </div>
        )}
        {dayTotalYear3 != null && (
          <div>
            <p className="text-[10px] text-bo-neutral-500 font-medium">{year - 3}</p>
            <p className="text-lg font-bold text-bo-neutral-300">{dayTotalYear3.toLocaleString()}</p>
          </div>
        )}
        {deltaVsPrev != null && (
          <div className="flex items-center gap-1 self-end mb-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{deltaVsPrev}%
            </span>
            <span className="text-[10px] text-bo-neutral-400">vs {year - 1}</span>
          </div>
        )}
      </div>

      {/* Year toggles (only for hourly with multiple years) */}
      {hasHourly && availableYears.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] text-bo-neutral-500 font-medium mr-1">Vertailu:</span>
          {availableYears.map((y, i) => (
            <button
              key={y.key}
              onClick={() => toggleYear(y.key)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                enabledYears.has(y.key)
                  ? 'border-transparent text-white'
                  : 'border-bo-neutral-200 text-bo-neutral-400 bg-transparent hover:border-bo-neutral-300'
              }`}
              style={enabledYears.has(y.key) ? { backgroundColor: YEAR_COLORS[i] } : undefined}
            >
              {y.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          {hasHourly ? (
            <LineChart data={hourlyChartData}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    current: `${year}`,
                    prevYear: `${year - 1}`,
                    year2: `${year - 2}`,
                    year3: `${year - 3}`,
                  };
                  return [Number(value).toLocaleString(), labels[String(name)] ?? String(name)];
                }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    current: `${year}`,
                    prevYear: `${year - 1}`,
                    year2: `${year - 2}`,
                    year3: `${year - 3}`,
                  };
                  return labels[value] ?? value;
                }}
              />
              {enabledYears.has('current') && (
                <Line type="monotone" dataKey="current" stroke={YEAR_COLORS[0]} strokeWidth={2} dot={false} />
              )}
              {enabledYears.has('prevYear') && hasYear1 && (
                <Line type="monotone" dataKey="prevYear" stroke={YEAR_COLORS[1]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              )}
              {enabledYears.has('year2') && hasYear2 && (
                <Line type="monotone" dataKey="year2" stroke={YEAR_COLORS[2]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              )}
              {enabledYears.has('year3') && hasYear3 && (
                <Line type="monotone" dataKey="year3" stroke={YEAR_COLORS[3]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              )}
            </LineChart>
          ) : (
            <BarChart data={dailyChartData} barCategoryGap="20%">
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(value, name) => [
                  Number(value).toLocaleString(),
                  String(name) === 'current' ? `${year}` : `${year - 1}`,
                ]}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value: string) => (value === 'current' ? `${year}` : `${year - 1}`)}
              />
              <Bar dataKey="current" fill={YEAR_COLORS[0]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="prevYear" fill="var(--color-bo-neutral-300, #d1d5db)" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
