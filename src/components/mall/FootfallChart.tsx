/**
 * Footfall Chart Component
 * Shows real hourly counter data when available.
 * Fills missing hours (no upload for today) from historical profile averages.
 * YoY comparison always uses real uploaded prevYear data, never hardcoded.
 */

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    hasProfile,
    hourlyTotalsForDate,
    findDateForWeekday,
    estimateForHour,
  } = useCounterFootfall(mallId);

  const now = new Date();
  const todayWeekday = now.getDay();

  const { data, anyEstimated } = useMemo(() => {
    const todayDate = findDateForWeekday();
    const hourly = todayDate ? hourlyTotalsForDate(todayDate) : [];

    const rows = OPERATING_HOURS.map((hr) => {
      const entry = hourly.find((h) => h.hour === hr);
      const realVisitors = entry?.visitors ?? 0;
      const realPrevYear = entry?.prevYear ?? null;

      let actual = realVisitors;
      let prevYear = realPrevYear ?? 0;
      let estimated = false;

      // Fill gaps from profile when real data is missing for this hour
      if (actual === 0 && (hasProfile || !hasRealData)) {
        const est = estimateForHour(todayWeekday, hr);
        if (est.visitors > 0) {
          actual = est.visitors;
          if (prevYear === 0 && est.prevYear != null) prevYear = est.prevYear;
          estimated = true;
        }
      } else if (prevYear === 0 && hasProfile) {
        // Real visitors exist but prevYear is missing, fill prevYear from profile.
        const est = estimateForHour(todayWeekday, hr);
        if (est.prevYear != null) prevYear = est.prevYear;
      }

      const weatherBoost = Math.round(actual * (weatherImpactPercent / 100));
      return { time: HOUR_LABELS[hr], actual, prevYear, weatherBoost, estimated };
    });

    return {
      data: rows.map((row) => ({
        time: row.time,
        actual: row.actual,
        prevYear: row.prevYear,
        weatherBoost: row.weatherBoost,
      })),
      anyEstimated: rows.some((row) => row.estimated),
    };
  }, [hasRealData, hasProfile, hourlyTotalsForDate, findDateForWeekday, estimateForHour, todayWeekday, weatherImpactPercent]);

  const hasAnyData = hasRealData || hasProfile;

  const badgeLabel = hasRealData && !anyEstimated
    ? t('footfall.realData', 'Real data')
    : anyEstimated
    ? t('footfall.estimated', 'Estimated')
    : null;

  return (
    <Card className="bo-surface rounded-xl border-2 border-bo-primary-200/50 p-6 shadow-bo-glass">
      <div className="mb-4 h-1.5 rounded-full bg-gradient-to-r from-bo-success-dark via-bo-primary-700 to-bo-info-dark" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('footfall.chartTitle')}</h3>
        {badgeLabel && (
          <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium uppercase tracking-wide ${
            hasRealData && !anyEstimated
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {badgeLabel}
          </span>
        )}
      </div>
      {hasAnyData ? (
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
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name={t('footfall.previousYear', 'Previous Year')}
            />
            <Line type="monotone" dataKey="weatherBoost" stroke="#214990" strokeWidth={1} name={t('footfall.weatherImpact')} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-bo-neutral-400 text-sm">
          {t('footfall.noData', 'No counter data uploaded yet')}
        </div>
      )}
    </Card>
  );
}
