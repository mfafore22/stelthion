'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GdprDisclaimer } from './GdprDisclaimer';
import { TIME_SLOTS, JOURNEY_OPTIONS, FLOW_DURATION_OPTIONS, MODE_META } from './constants';
import type { AnalysisMode } from './types';

interface VideoAnalysisConfigProps {
  mode: AnalysisMode;
  onSubmit: (form: {
    date: string;
    startTime: string;
    endTime: string;
    journeyCount: number;
  }) => Promise<void>;
  submitting: boolean;
}

export function VideoAnalysisConfig({
  mode, onSubmit, submitting,
}: VideoAnalysisConfigProps) {
  const { t } = useTranslation('mall');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState<number>(FLOW_DURATION_OPTIONS[0]); // 30 min
  const [journeyCount, setJourneyCount] = useState(10);

  // Compute end time from start + duration, clamp to 23:00
  const endTime = (() => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + duration;
    const maxMin = 23 * 60;
    const clampedMin = Math.min(totalMin, maxMin);
    const eh = Math.floor(clampedMin / 60);
    const em = clampedMin % 60;
    return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
  })();

  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const showSampleSize = mode === 'AB_TRACKING' || mode === 'JOURNEY_MAP';
  const showGdpr = mode === 'AB_TRACKING' || mode === 'JOURNEY_MAP';

  const canSubmit = !!date;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      date,
      startTime,
      endTime,
      journeyCount: showSampleSize ? journeyCount : 0,
    });
  };

  const submitLabel = (() => {
    if (submitting) return t('videoAnalysis.actions.submitting', 'Scheduling...');
    if (mode === 'ZONE_COUNT') return t('videoAnalysis.actions.runCount', 'Count Visitors');
    if (mode === 'AB_TRACKING') return t('videoAnalysis.actions.runTracking', 'Track Flow');
    return t('videoAnalysis.actions.mapJourneys', 'Map Journeys');
  })();

  const modeMeta = MODE_META[mode];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Controls row */}
      <div className={cn(
        'grid gap-4',
        showSampleSize ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3',
      )}>
        {/* Date */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
            <Calendar className="w-3.5 h-3.5" /> {t('videoAnalysis.config.date', 'Date')}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
            required
            className={cn(
              'w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950',
              'focus:outline-none focus:ring-2 focus:ring-bo-primary-300/50 focus:border-bo-primary-400',
              'transition-shadow duration-200',
            )}
          />
        </div>

        {/* Start time */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
            <Clock className="w-3.5 h-3.5" /> {t('videoAnalysis.config.startTime', 'Start Time')}
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full text-sm border border-bo-neutral-200 rounded-lg px-2 py-2 bg-white text-bo-neutral-950 focus:outline-none focus:ring-2 focus:ring-bo-primary-300/50 transition-shadow duration-200"
          >
            {TIME_SLOTS.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
            <Clock className="w-3.5 h-3.5" /> {t('videoAnalysis.config.duration', 'Duration')}
          </label>
          <div className="flex gap-1">
            {FLOW_DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 text-xs py-2 rounded-lg border transition-all duration-200',
                  duration === d
                    ? 'bg-bo-neutral-950 text-white border-bo-neutral-950'
                    : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-50 hover:border-bo-neutral-300',
                )}
              >
                {d} {t('videoAnalysis.config.minutes', 'min')}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-bo-neutral-400 mt-1">
            {t('videoAnalysis.config.endTime', 'End time')}: {endTime}
          </p>
        </div>

        {/* Sample size (AB_TRACKING + JOURNEY_MAP only) */}
        {showSampleSize && (
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <Users className="w-3.5 h-3.5" /> {t('videoAnalysis.config.sampleSize', 'Sample Size')}
            </label>
            <div className="flex gap-1">
              {JOURNEY_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setJourneyCount(n)}
                  className={cn(
                    'flex-1 text-xs py-2 rounded-lg border transition-all duration-200',
                    journeyCount === n
                      ? 'bg-bo-neutral-950 text-white border-bo-neutral-950'
                      : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-50 hover:border-bo-neutral-300',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GDPR disclaimer for tracking modes */}
      {showGdpr && <GdprDisclaimer />}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg',
          'bg-bo-neutral-950 text-bo-neutral-50',
          'hover:bg-bo-neutral-900 hover:shadow-bo-lg hover:-translate-y-0.5',
          'active:translate-y-0 active:duration-100',
          'disabled:opacity-50 disabled:pointer-events-none',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        )}
      >
        <modeMeta.icon className="w-4 h-4" />
        {submitLabel}
      </button>
    </form>
  );
}
