/**
 * Footfall Chart Component
 * Shows real hourly counter data when available, falls back to simulated curve.
 */

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { estimateCurrentFootfall } from '@/lib/data/footfall';
import { useWeather } from '@/hooks/mall/useWeather';
import { useCounterFootfall } from '@/hooks/mall/useCounterFootfall';
import { useTranslation } from 'react-i18next';

interface FootfallChartProps {
  mallId: string;
  showPredicted?: boolean;
}

const OPERATING_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const HOUR_LABELS: Record<number, string> = {
  10: '10:00', 11: '11:00', 12: '12:00', 13: '13:00', 14: '14:00',
  15: '15:00', 16: '16:00', 17: '17:00', 18: '18:00', 19: '19:00',
  20: '20:00', 21: '21:00',
};

export function FootfallChart({ mallId }: FootfallChartProps) {
  const { t } = useTranslation('mall');
  const { weather } = useWeather(mallId);
  const weatherImpactPercent = weather?.footfallImpact ?? 6.2;

  const {
    hasRealData,
    hourlyTotalsForDate,
    findDateForWeekday,
  } = useCounterFootfall(mallId);

  const data = useMemo(() => {
    if (hasRealData) {
      const todayDate = findDateForWeekday();
      if (todayDate) {
        const hourly = hourlyTotalsForDate(todayDate);
        return OPERATING_HOURS.map((hr) => {
          const entry = hourly.find((h) => h.hour === hr);
          const actual = entry?.visitors ?? 0;
          const prevYear = entry?.prevYear ?? 0;
          const weatherBoost = Math.round(actual * (weatherImpactPercent / 100));
          return {
            time: HOUR_LABELS[hr],
            actual,
            prevYear,
            weatherBoost,
          };
        });
      }
    }

    // Fallback: simulated data (6 sampled hours)
    const hours = [
      { label: '10:00', hour: 10 },
      { label: '12:00', hour: 12 },
      { label: '14:00', hour: 14 },
      { label: '16:00', hour: 16 },
      { label: '18:00', hour: 18 },
      { label: '20:00', hour: 20 },
    ];
    return hours.map(({ label, hour }) => {
      const d = new Date();
      d.setHours(hour, 0, 0, 0);
      const { currentVisitors } = estimateCurrentFootfall(d);
      const variation = 0.95 + Math.random() * 0.1;
      const actual = Math.round(currentVisitors * variation);
      const prevYear = Math.round(actual / 1.08);
      const weatherBoost = Math.round(actual * (weatherImpactPercent / 100));
      return { time: label, actual, prevYear, weatherBoost };
    });
  }, [hasRealData, hourlyTotalsForDate, findDateForWeekday, weatherImpactPercent]);

  const comparisonLabel = hasRealData
    ? t('footfall.previousYear', 'Previous Year')
    : t('footfall.predicted', 'Predicted');

  return (
    <Card className="p-6 bg-bo-glass border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('footfall.chartTitle')}</h3>
        {hasRealData && (
          <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium uppercase tracking-wide">
            {t('footfall.realData', 'Real data')}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 213, 214, 0.3)" />
          <XAxis dataKey="time" stroke="#7A7A7A" style={{ fontSize: '13px' }} />
          <YAxis stroke="#7A7A7A" style={{ fontSize: '13px' }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(248, 246, 243, 0.95)',
              border: '1px solid rgba(212, 213, 214, 0.3)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '13px' }} />
          <Line type="monotone" dataKey="actual" stroke="#328d2e" strokeWidth={2} name={t('footfall.actual')} />
          <Line
            type="monotone"
            dataKey="prevYear"
            stroke={hasRealData ? '#3b82f6' : '#7cb928'}
            strokeWidth={2}
            strokeDasharray="5 5"
            name={comparisonLabel}
          />
          <Line type="monotone" dataKey="weatherBoost" stroke="#214990" strokeWidth={1} name={t('footfall.weatherImpact')} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
