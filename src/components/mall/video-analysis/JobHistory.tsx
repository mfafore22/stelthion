'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, MODE_META } from './constants';
import type { AnalysisJob, AnalysisMode } from './types';

interface JobHistoryProps {
  jobs: AnalysisJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}

export function JobHistory({ jobs, selectedJobId, onSelectJob }: JobHistoryProps) {
  const { t } = useTranslation('mall');
  const [expanded, setExpanded] = useState(true);

  if (jobs.length === 0) return null;

  return (
    <div className="border-t border-bo-neutral-100 pt-4 mt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        <Clock className="w-4 h-4 text-bo-neutral-500" />
        <h4 className="text-sm font-semibold text-bo-neutral-800 flex-1">
          {t('videoAnalysis.history.title')}
        </h4>
        <span className="text-[10px] text-bo-neutral-400 bg-bo-neutral-100 px-2 py-0.5 rounded-full tabular-nums">
          {jobs.length}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-bo-neutral-400 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {jobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            const modeMeta = MODE_META[job.mode as AnalysisMode];
            const cameraLabel = job.camera?.label ?? '–';
            const dateStr = new Date(job.footageDate).toLocaleDateString();

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(isSelected ? null : job.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  isSelected
                    ? 'bg-bo-primary-50 border border-bo-primary-200 shadow-sm'
                    : 'bg-bo-neutral-50 border border-transparent hover:bg-bo-neutral-100',
                )}
              >
                {/* Mode badge */}
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0', modeMeta?.color ?? 'bg-bo-neutral-100 text-bo-neutral-600')}>
                  {t(modeMeta?.labelKey ?? 'videoAnalysis.modes.zoneCount')}
                </span>

                {/* Job details */}
                <span className="flex-1 text-xs text-bo-neutral-700 truncate">
                  {cameraLabel}
                  {job.secondaryCamera && ` → ${job.secondaryCamera.label}`}
                  {' · '}
                  {dateStr} · {job.startTime}–{job.endTime}
                  {job.journeyCount > 0 && ` · ${job.journeyCount} tracked`}
                </span>

                {/* Status badge */}
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0', STATUS_COLORS[job.status] ?? '')}>
                  {t(`videoAnalysis.history.status.${job.status.toLowerCase()}`, job.status)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
