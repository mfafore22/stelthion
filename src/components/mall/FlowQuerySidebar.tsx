/**
 * FlowQuerySidebar — Flow analysis form + results panel.
 * Direction is derived automatically: 1 zone = outbound, 2 zones = between.
 * No manual direction toggle — the mode is inferred from zone selection.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneStorePicker } from './ZoneStorePicker';
import { FlowQueryResults } from './FlowQueryResults';
import { TIME_SLOTS, FLOW_SAMPLE_OPTIONS, FLOW_DURATION_OPTIONS } from './video-analysis/constants';
import type { FlowQueryResponse } from '@/lib/types/flowQuery';
import { useTranslation } from 'react-i18next';

interface FlowQuerySidebarProps {
  mallId: string;
  origin: string | null;
  destination: string | null;
  onOriginChange: (id: string | null) => void;
  onDestinationChange: (id: string | null) => void;
  zones?: { id: string; name: string; nameFi: string; category: string }[];
}

export function FlowQuerySidebar({
  mallId,
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  zones,
}: FlowQuerySidebarProps) {
  const { t } = useTranslation('mall');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowQueryResponse | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState<number>(FLOW_DURATION_OPTIONS[0]); // 30 min default
  const [sampleSize, setSampleSize] = useState<number>(FLOW_SAMPLE_OPTIONS[0]); // 10 default

  // Compute end time from start + duration, clamp to 23:00
  const endTime = useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + duration;
    const maxMin = 23 * 60; // 23:00
    const clampedMin = Math.min(totalMin, maxMin);
    const eh = Math.floor(clampedMin / 60);
    const em = clampedMin % 60;
    return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
  }, [startTime, duration]);

  // Derive direction from selection — no manual toggle
  const direction = destination ? 'between' : 'outbound';

  // Clear results when selections change
  useEffect(() => {
    setResult(null);
  }, [origin, destination]);

  const handleSubmit = useCallback(async () => {
    if (!origin) return;

    setLoading(true);
    try {
      const hour = parseInt(startTime.split(':')[0], 10);
      const dayOfWeek = new Date(date).getDay();

      const res = await fetch(`/api/flow-query/${mallId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          direction,
          destination: destination ?? undefined,
          hour,
          dayOfWeek,
          date,
          startTime,
          endTime,
          sampleSize,
        }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (err) {
      console.error('Flow query failed:', err);
    } finally {
      setLoading(false);
    }
  }, [mallId, origin, direction, destination, date, startTime, endTime, sampleSize]);

  const handleReset = useCallback(() => {
    setResult(null);
    onOriginChange(null);
    onDestinationChange(null);
  }, [onOriginChange, onDestinationChange]);

  if (result) {
    return <FlowQueryResults data={result} onReset={handleReset} />;
  }

  return (
    <div className="space-y-4">

      {/* Step 1: Start zone */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4.5 h-4.5 rounded-full bg-bo-neutral-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
          <span className="text-xs font-semibold text-bo-neutral-700">
            {t('flowQuery.stepOrigin')}
          </span>
        </div>
        <ZoneStorePicker
          value={origin}
          onChange={(v) => { onOriginChange(v); onDestinationChange(null); }}
          placeholder={t('flowQuery.originPlaceholder')}
          zones={zones}
        />
        {!origin && (
          <p className="text-[10px] text-bo-neutral-400 mt-1">
            {t('flowQuery.clickHint')}
          </p>
        )}
      </div>

      {/* Step 2: End zone */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4.5 h-4.5 rounded-full bg-bo-neutral-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
          <span className="text-xs font-semibold text-bo-neutral-700">
            {t('flowQuery.stepDestination')}
          </span>
        </div>
        <ZoneStorePicker
          value={destination}
          onChange={onDestinationChange}
          exclude={origin ? [origin] : []}
          placeholder={t('flowQuery.destinationPlaceholder')}
          zones={zones}
        />
        {!destination && (
          <p className="text-[10px] text-bo-neutral-400 mt-1">
            {t('flowQuery.destinationOptionalHint')}
          </p>
        )}
      </div>

      {/* Step 3: Date & time */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4.5 h-4.5 rounded-full bg-bo-neutral-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
          <span className="text-xs font-semibold text-bo-neutral-700">
            {t('flowQuery.stepTime')}
          </span>
        </div>

        <div className="mb-2">
          <label className="flex items-center gap-1 text-[10px] font-medium text-bo-neutral-500 mb-1">
            <Calendar className="w-3 h-3" /> {t('flowQuery.date')}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              'w-full text-xs border border-bo-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-bo-neutral-950',
              'focus:outline-none focus:ring-1 focus:ring-bo-neutral-300 focus:border-bo-neutral-400',
              'transition-shadow duration-200',
            )}
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-[10px] font-medium text-bo-neutral-500 mb-1">
            <Clock className="w-3 h-3" /> {t('flowQuery.startTime', 'Start time')}
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full text-xs border border-bo-neutral-200 rounded-lg px-2 py-1.5 bg-white text-bo-neutral-950 focus:outline-none focus:ring-1 focus:ring-bo-neutral-300 transition-shadow duration-200"
          >
            {TIME_SLOTS.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-[10px] font-medium text-bo-neutral-500 mb-1">
            <Clock className="w-3 h-3" /> {t('flowQuery.duration', 'Duration')}
          </label>
          <div className="flex gap-1">
            {FLOW_DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 text-[11px] py-1.5 rounded-lg border transition-all duration-200',
                  duration === d
                    ? 'bg-bo-neutral-950 text-white border-bo-neutral-950'
                    : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-50 hover:border-bo-neutral-300',
                )}
              >
                {d} {t('flowQuery.minutes', 'min')}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-bo-neutral-400 mt-1">
            {t('flowQuery.endTimeComputed', 'End time')}: {endTime}
          </p>
        </div>
      </div>

      {/* Step 4: Sample size */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4.5 h-4.5 rounded-full bg-bo-neutral-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0">4</span>
          <span className="text-xs font-semibold text-bo-neutral-700">
            {t('flowQuery.sampleSize', 'Sample size')}
          </span>
        </div>
        <div className="flex gap-1">
          {FLOW_SAMPLE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSampleSize(n)}
              className={cn(
                'flex-1 text-[11px] py-1.5 rounded-lg border transition-all duration-200',
                sampleSize === n
                  ? 'bg-bo-neutral-950 text-white border-bo-neutral-950'
                  : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-50 hover:border-bo-neutral-300',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-bo-neutral-400 mt-1">
          {t('flowQuery.trackedIndividuals', 'tracked individuals')}
        </p>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!origin || !destination || loading}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-all',
          origin && destination && !loading
            ? 'bg-bo-neutral-800 text-white hover:bg-bo-neutral-900 shadow-sm'
            : 'bg-bo-neutral-100 text-bo-neutral-400 cursor-not-allowed'
        )}
      >
        {loading
          ? t('flowQuery.analyzing')
          : t('flowQuery.analyzeRoute')}
      </button>
    </div>
  );
}
