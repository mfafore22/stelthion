'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import type { JourneySession } from './types';

interface TrackingResultProps {
  session: JourneySession;
  cameraALabel: string;
  cameraBLabel: string;
}

export function TrackingResult({ session, cameraALabel, cameraBLabel }: TrackingResultProps) {
  const { t } = useTranslation('mall');

  const matchRate = session.taggedCount > 0
    ? Math.round((session.recognizedCount / session.taggedCount) * 100)
    : 0;

  // Parse time gaps from journey paths
  const timeGapData = useMemo(() => {
    const gaps: number[] = [];
    for (const path of session.paths) {
      try {
        const timestamps: string[] = JSON.parse(path.timestamps);
        if (timestamps.length >= 2) {
          const first = new Date(timestamps[0]).getTime();
          const last = new Date(timestamps[timestamps.length - 1]).getTime();
          const gapMin = Math.round((last - first) / 60000);
          if (gapMin > 0) gaps.push(gapMin);
        }
      } catch { /* skip */ }
    }
    if (gaps.length === 0) return { histogram: [], avg: 0, median: 0, min: 0, max: 0 };

    const sorted = [...gaps].sort((a, b) => a - b);
    const avg = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Build histogram buckets (5-min intervals)
    const bucketSize = 5;
    const buckets: Record<string, number> = {};
    for (const g of gaps) {
      const bucket = Math.floor(g / bucketSize) * bucketSize;
      const label = `${bucket}–${bucket + bucketSize}`;
      buckets[label] = (buckets[label] ?? 0) + 1;
    }

    return {
      histogram: Object.entries(buckets).map(([range, count]) => ({ range, count })),
      avg,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }, [session.paths]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Funnel visualization */}
      <div className="flex items-center gap-3 p-5 rounded-xl bg-gradient-to-r from-bo-accent-50 to-bo-primary-50 border border-bo-neutral-200/50">
        {/* Camera A */}
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider font-medium text-bo-accent-600 mb-1">
            {cameraALabel}
          </p>
          <p className="text-3xl font-bold text-bo-accent-700 tabular-nums">
            {session.taggedCount}
          </p>
          <p className="text-xs text-bo-neutral-500">
            {t('videoAnalysis.results.entryCount')}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 px-3">
          <ArrowRight className="w-6 h-6 text-bo-neutral-400" />
          <div className="h-0.5 w-12 bg-gradient-to-r from-bo-accent-300 to-bo-primary-300 rounded-full" />
        </div>

        {/* Camera B */}
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider font-medium text-bo-primary-600 mb-1">
            {cameraBLabel}
          </p>
          <p className="text-3xl font-bold text-bo-primary-700 tabular-nums">
            {session.recognizedCount}
          </p>
          <p className="text-xs text-bo-neutral-500">
            {t('videoAnalysis.results.matchedCount')}
          </p>
        </div>

        {/* Match Rate */}
        <div className="flex-1 text-center border-l border-bo-neutral-200 pl-4">
          <p className="text-[10px] uppercase tracking-wider font-medium text-bo-neutral-600 mb-1">
            {t('videoAnalysis.results.matchRate')}
          </p>
          <p className="text-3xl font-bold text-bo-neutral-900 tabular-nums">
            {matchRate}%
          </p>
        </div>
      </div>

      {/* Time gap stats */}
      {timeGapData.histogram.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label={t('videoAnalysis.results.avgTimeGap')} value={`${timeGapData.avg} min`} />
          <StatCard label={t('videoAnalysis.results.medianGap', 'Median')} value={`${timeGapData.median} min`} />
          <StatCard label={t('videoAnalysis.results.shortest', 'Shortest')} value={`${timeGapData.min} min`} />
          <StatCard label={t('videoAnalysis.results.longest', 'Longest')} value={`${timeGapData.max} min`} />
        </div>
      )}

      {/* Time gap histogram */}
      {timeGapData.histogram.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-3">
            {t('videoAnalysis.results.timeGapDistribution')}
          </h4>
          <div className="h-40 rounded-lg bg-bo-neutral-50/50 p-3 border border-bo-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeGapData.histogram} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD9" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10, fill: '#7A7674' }}
                  axisLine={{ stroke: '#E0DDD9' }}
                  tickLine={false}
                  label={{ value: 'min', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9C9896' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#7A7674' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(248,246,243,0.95)',
                    border: '1px solid #E0DDD9',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#214990" radius={[3, 3, 0, 0]} name="People" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Future: LLM Analysis placeholder */}
      <div className="rounded-xl border-2 border-dashed border-bo-neutral-200 bg-bo-neutral-50/30 p-5 text-center">
        <Lock className="w-5 h-5 text-bo-neutral-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-bo-neutral-500">
          {t('videoAnalysis.future.llmAnalysis')}
        </p>
        <p className="text-xs text-bo-neutral-400 mt-1">
          {t('videoAnalysis.future.llmDescription', 'AI-powered insights about visitor patterns and behaviour')}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bo-neutral-50 rounded-lg p-3 text-center border border-bo-neutral-100">
      <p className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-bo-neutral-900 tabular-nums">{value}</p>
    </div>
  );
}
