'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { JourneySession, Zone } from './types';

interface JourneyMapResultProps {
  session: JourneySession;
  selectedZoneIds: string[];
  zones: Zone[];
}

export function JourneyMapResult({ session, selectedZoneIds, zones }: JourneyMapResultProps) {
  const { t, i18n } = useTranslation('mall');
  const isFi = i18n.language === 'fi';
  const zoneName = (z: { name: string; nameFi: string }) => isFi ? z.nameFi : z.name;

  const zoneById = useMemo(() => {
    const map = new Map<string, Zone>();
    for (const z of zones) map.set(z.id, z);
    return map;
  }, [zones]);

  const getZoneLabel = (id: string) => {
    const z = zoneById.get(id);
    return z ? zoneName(z) : id;
  };

  // Parse paths and compute frequencies
  const parsedPaths = useMemo(() => {
    return session.paths.map((p) => {
      try {
        const zoneSeq: string[] = JSON.parse(p.zoneSequence);
        const times: string[] = JSON.parse(p.timestamps);
        const totalMinutes = times.length >= 2
          ? Math.round((new Date(times[times.length - 1]).getTime() - new Date(times[0]).getTime()) / 60000)
          : 0;
        return { id: p.id, zones: zoneSeq, totalMinutes };
      } catch {
        return { id: p.id, zones: [] as string[], totalMinutes: 0 };
      }
    }).filter((p) => p.zones.length > 0);
  }, [session.paths]);

  // Most common path
  const pathFrequencies = useMemo(() => {
    const freq: Record<string, { path: string[]; count: number }> = {};
    for (const p of parsedPaths) {
      const key = p.zones.join('→');
      if (!freq[key]) freq[key] = { path: p.zones, count: 0 };
      freq[key].count++;
    }
    return Object.values(freq).sort((a, b) => b.count - a.count);
  }, [parsedPaths]);

  // Zone visit frequency (for summary)
  const zoneVisitFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const p of parsedPaths) {
      for (const z of p.zones) {
        freq[z] = (freq[z] ?? 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .map(([zoneId, count]) => ({ zoneId, count }));
  }, [parsedPaths]);

  const matchRate = session.taggedCount > 0
    ? Math.round((session.recognizedCount / session.taggedCount) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label={t('videoAnalysis.results.tagged', 'Tagged')}
          value={session.taggedCount}
        />
        <SummaryCard
          label={t('videoAnalysis.results.reIdentified', 'Re-identified')}
          value={session.recognizedCount}
        />
        <SummaryCard
          label={t('videoAnalysis.results.matchRate')}
          value={`${matchRate}%`}
        />
      </div>

      {/* Most common path */}
      {pathFrequencies.length > 0 && (
        <div className="rounded-xl bg-bo-beige-100 border border-bo-beige-200 p-4">
          <h4 className="text-xs font-medium text-bo-beige-800 uppercase tracking-wider mb-2">
            {t('videoAnalysis.results.mostCommonPath')}
          </h4>
          <div className="flex items-center gap-1.5 flex-wrap">
            {pathFrequencies[0].path.map((zoneId, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-bo-neutral-800 border border-bo-neutral-200 shadow-sm">
                  {getZoneLabel(zoneId)}
                </span>
                {i < pathFrequencies[0].path.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-bo-neutral-400" />
                )}
              </span>
            ))}
            <span className="ml-2 text-xs text-bo-beige-800 font-medium">
              ({pathFrequencies[0].count}×)
            </span>
          </div>
        </div>
      )}

      {/* Zone visit frequency table */}
      {zoneVisitFreq.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-2">
            {t('videoAnalysis.results.zoneFrequency', 'Zone Visit Frequency')}
          </h4>
          <div className="rounded-lg border border-bo-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bo-neutral-50 border-b border-bo-neutral-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">
                    {t('videoAnalysis.results.zone', 'Zone')}
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">
                    {t('videoAnalysis.results.visits', 'Visits')}
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-bo-neutral-600 w-32">
                    {t('videoAnalysis.results.share', 'Share')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bo-neutral-100">
                {zoneVisitFreq.map(({ zoneId, count }) => {
                  const maxCount = zoneVisitFreq[0]?.count ?? 1;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <tr key={zoneId}>
                      <td className="px-4 py-2 text-bo-neutral-900">{getZoneLabel(zoneId)}</td>
                      <td className="px-4 py-2 text-right font-medium text-bo-neutral-900 tabular-nums">{count}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-bo-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-bo-primary-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-bo-neutral-500 tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual journey paths */}
      {parsedPaths.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-2">
            {t('videoAnalysis.results.journeyPaths')}
          </h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {parsedPaths.map((path, i) => (
              <div
                key={path.id}
                className="flex items-center gap-1.5 px-3 py-2 bg-bo-neutral-50 rounded-lg text-sm"
              >
                <span className="text-[10px] font-medium text-bo-neutral-400 w-5 shrink-0">#{i + 1}</span>
                <div className="flex items-center gap-1 flex-wrap flex-1">
                  {path.zones.map((zoneId, j) => {
                    const isSelected = selectedZoneIds.includes(zoneId);
                    return (
                      <span key={j} className="flex items-center gap-1">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            isSelected
                              ? 'bg-bo-primary-50 text-bo-primary-800 border border-bo-primary-200'
                              : 'bg-bo-neutral-100 text-bo-neutral-600',
                          )}
                        >
                          {getZoneLabel(zoneId)}
                        </span>
                        {j < path.zones.length - 1 && <ArrowRight className="w-3 h-3 text-bo-neutral-300" />}
                      </span>
                    );
                  })}
                </div>
                {path.totalMinutes > 0 && (
                  <span className="text-[10px] text-bo-neutral-400 shrink-0 tabular-nums">
                    {path.totalMinutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future: Visitor counter placeholder */}
      <div className="rounded-xl border-2 border-dashed border-bo-neutral-200 bg-bo-neutral-50/30 p-5 text-center">
        <Lock className="w-5 h-5 text-bo-neutral-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-bo-neutral-500">
          {t('videoAnalysis.future.visitorCounters')}
        </p>
        <p className="text-xs text-bo-neutral-400 mt-1">
          {t('videoAnalysis.future.counterDescription', 'Compare and extrapolate with visitor counter data')}
        </p>
      </div>
    </motion.div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-bo-neutral-50 rounded-lg p-3 text-center border border-bo-neutral-100">
      <p className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-bo-neutral-900 tabular-nums">{value}</p>
    </div>
  );
}
