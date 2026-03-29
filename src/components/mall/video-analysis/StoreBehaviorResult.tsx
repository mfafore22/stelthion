'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Footprints, Hand, DoorOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import type { StoreBehavior } from './types';

interface StoreBehaviorResultProps {
  behaviors: StoreBehavior[];
  dateStr: string;
  timeRange: string;
}

export function StoreBehaviorResult({ behaviors, dateStr, timeRange }: StoreBehaviorResultProps) {
  const { t } = useTranslation('mall');

  // Aggregate by store
  const storeAgg = useMemo(() => {
    const map: Record<string, { walkBy: number; stop: number; enter: number }> = {};
    for (const b of behaviors) {
      if (!map[b.zoneId]) map[b.zoneId] = { walkBy: 0, stop: 0, enter: 0 };
      map[b.zoneId].walkBy += b.walkBy;
      map[b.zoneId].stop += b.stop;
      map[b.zoneId].enter += b.enter;
    }
    return Object.entries(map)
      .map(([zoneId, counts]) => {
        const total = counts.walkBy + counts.stop + counts.enter;
        return {
          zoneId,
          name: zoneId.replace('store-', '').replace(/-/g, ' '),
          ...counts,
          total,
          stopRate: total > 0 ? (counts.stop / total) * 100 : 0,
          enterRate: total > 0 ? (counts.enter / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [behaviors]);

  // Hourly totals across all stores
  const hourlyData = useMemo(() => {
    const byHour: Record<number, { walkBy: number; stop: number; enter: number }> = {};
    for (const b of behaviors) {
      if (!byHour[b.hour]) byHour[b.hour] = { walkBy: 0, stop: 0, enter: 0 };
      byHour[b.hour].walkBy += b.walkBy;
      byHour[b.hour].stop += b.stop;
      byHour[b.hour].enter += b.enter;
    }
    return Object.entries(byHour)
      .map(([hour, counts]) => ({ hour: `${hour}:00`, ...counts }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [behaviors]);

  const totals = useMemo(() => {
    const w = behaviors.reduce((s, b) => s + b.walkBy, 0);
    const st = behaviors.reduce((s, b) => s + b.stop, 0);
    const e = behaviors.reduce((s, b) => s + b.enter, 0);
    return { walkBy: w, stop: st, enter: e, total: w + st + e };
  }, [behaviors]);

  if (behaviors.length === 0) {
    return (
      <p className="text-sm text-bo-neutral-500 text-center py-4">
        {t('videoAnalysis.results.noResults')}
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<Footprints className="w-4 h-4" />}
          label={t('videoAnalysis.storeBehavior.walkBy', 'Walk-by')}
          value={totals.walkBy}
          color="text-bo-neutral-600"
          bgColor="bg-bo-neutral-50"
        />
        <SummaryCard
          icon={<Hand className="w-4 h-4" />}
          label={t('videoAnalysis.storeBehavior.stop', 'Stop')}
          value={totals.stop}
          pct={totals.total > 0 ? (totals.stop / totals.total) * 100 : 0}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <SummaryCard
          icon={<DoorOpen className="w-4 h-4" />}
          label={t('videoAnalysis.storeBehavior.enter', 'Enter')}
          value={totals.enter}
          pct={totals.total > 0 ? (totals.enter / totals.total) * 100 : 0}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
      </div>

      <p className="text-xs text-bo-neutral-500 text-center">
        {dateStr} &middot; {timeRange}
      </p>

      {/* Hourly stacked bar chart */}
      {hourlyData.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-3">
            {t('videoAnalysis.storeBehavior.hourlyBreakdown', 'Hourly Breakdown')}
          </h4>
          <div className="h-48 rounded-lg bg-bo-neutral-50/50 p-3 border border-bo-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#7A7674' }} axisLine={{ stroke: '#E0DDD9' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7674' }} axisLine={false} tickLine={false} width={40} />
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
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="walkBy" stackId="a" fill="#9CA3AF" radius={[0, 0, 0, 0]} name={t('videoAnalysis.storeBehavior.walkBy', 'Walk-by')} />
                <Bar dataKey="stop" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} name={t('videoAnalysis.storeBehavior.stop', 'Stop')} />
                <Bar dataKey="enter" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} name={t('videoAnalysis.storeBehavior.enter', 'Enter')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-store table */}
      <div>
        <h4 className="text-sm font-medium text-bo-neutral-700 mb-3 flex items-center gap-1.5">
          <Store className="w-4 h-4" />
          {t('videoAnalysis.storeBehavior.byStore', 'By Store')}
        </h4>
        <div className="rounded-lg border border-bo-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bo-neutral-50 text-bo-neutral-600">
                <th className="text-left px-3 py-2 font-medium">{t('videoAnalysis.storeBehavior.store', 'Store')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('videoAnalysis.storeBehavior.walkBy', 'Walk-by')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('videoAnalysis.storeBehavior.stop', 'Stop')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('videoAnalysis.storeBehavior.enter', 'Enter')}</th>
                <th className="text-right px-3 py-2 font-medium">{t('videoAnalysis.storeBehavior.conversionRate', 'Conversion')}</th>
              </tr>
            </thead>
            <tbody>
              {storeAgg.map((store) => (
                <tr key={store.zoneId} className="border-t border-bo-neutral-100 hover:bg-bo-neutral-50/50">
                  <td className="px-3 py-2 font-medium text-bo-neutral-800 capitalize">{store.name}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-bo-neutral-600">{store.walkBy.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-amber-600">{store.stop.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-emerald-600">{store.enter.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 tabular-nums font-medium text-bo-primary-700">{store.enterRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  pct,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct?: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 text-center border border-bo-neutral-200/40`}>
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value.toLocaleString()}</p>
      {pct != null && (
        <p className="text-[10px] text-bo-neutral-500 mt-0.5">{pct.toFixed(1)}%</p>
      )}
    </div>
  );
}
