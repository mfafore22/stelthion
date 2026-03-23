'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import type { JobWithResults } from './types';

interface ZoneCountResultProps {
  job: JobWithResults;
}

export function ZoneCountResult({ job }: ZoneCountResultProps) {
  const { t } = useTranslation('mall');

  const totalVisitors = useMemo(
    () => job.results.reduce((sum, r) => sum + r.count, 0),
    [job.results],
  );

  // Group by hour for the bar chart
  const hourlyData = useMemo(() => {
    const byHour: Record<number, number> = {};
    for (const r of job.results) {
      byHour[r.hour] = (byHour[r.hour] ?? 0) + r.count;
    }
    return Object.entries(byHour)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [job.results]);

  const cameraLabel = job.camera?.label ?? '—';
  const dateStr = new Date(job.footageDate).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Hero number */}
      <div className="bg-gradient-to-br from-bo-primary-50 to-bo-primary-100/50 rounded-xl p-6 text-center border border-bo-primary-200/40">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Users className="w-5 h-5 text-bo-primary-500" />
          <span className="text-xs font-medium text-bo-primary-600 uppercase tracking-wider">
            {t('videoAnalysis.results.totalVisitors')}
          </span>
        </div>
        <p className="text-4xl font-bold text-bo-primary-800 tabular-nums">
          {totalVisitors.toLocaleString()}
        </p>
        <p className="text-xs text-bo-primary-500 mt-1">
          {cameraLabel} &middot; {dateStr} &middot; {job.startTime}–{job.endTime}
        </p>
      </div>

      {/* Hourly breakdown chart */}
      {hourlyData.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-3">
            {t('videoAnalysis.results.hourlyBreakdown')}
          </h4>
          <div className="h-48 rounded-lg bg-bo-neutral-50/50 p-3 border border-bo-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#7A7674' }}
                  axisLine={{ stroke: '#E0DDD9' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7A7674' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(248,246,243,0.95)',
                    border: '1px solid #E0DDD9',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 4px 8px rgba(26,26,26,0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1E1E1C' }}
                />
                <Bar
                  dataKey="count"
                  fill="#328d2e"
                  radius={[4, 4, 0, 0]}
                  name={t('videoAnalysis.results.visitors')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {job.results.length === 0 && (
        <p className="text-sm text-bo-neutral-500 text-center py-4">
          {t('videoAnalysis.results.noResults')}
        </p>
      )}
    </motion.div>
  );
}
