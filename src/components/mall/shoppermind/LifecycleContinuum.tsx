'use client';

import { useTranslation } from 'react-i18next';
import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';
import { cn } from '@/lib/utils';
import { useStateLabels } from './StateBadge';

const ORDER: PhenomenonStateValue[] = [
  'EMERGING',
  'ACCELERATING',
  'STABLE',
  'FADING',
  'DORMANT',
];

const HEAT_CLASSES: Record<PhenomenonStateValue, string> = {
  EMERGING: 'bg-sky-500',
  ACCELERATING: 'bg-emerald-500',
  STABLE: 'bg-amber-400',
  FADING: 'bg-orange-500',
  DORMANT: 'bg-bo-neutral-400',
};

const HEAT_RING: Record<PhenomenonStateValue, string> = {
  EMERGING: 'ring-sky-500/40 shadow-sky-500/40',
  ACCELERATING: 'ring-emerald-500/40 shadow-emerald-500/40',
  STABLE: 'ring-amber-400/50 shadow-amber-400/40',
  FADING: 'ring-orange-500/40 shadow-orange-500/40',
  DORMANT: 'ring-bo-neutral-400/40 shadow-bo-neutral-400/30',
};

export function LifecycleContinuum({
  state,
  compositeScore,
  velocity,
  className,
}: {
  state: PhenomenonStateValue;
  compositeScore?: number;
  velocity?: number;
  className?: string;
}) {
  const { t } = useTranslation('mall');
  const labels = useStateLabels();
  const activeIdx = ORDER.indexOf(state);
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-bo-neutral-500">
        <span className="uppercase tracking-wider font-medium">
          {t('shoppermind.lifecycle.label')}
        </span>
        {typeof compositeScore === 'number' && (
          <span>
            {t('shoppermind.lifecycle.relevance')}{' '}
            <strong className="text-bo-neutral-800">{compositeScore.toFixed(2)}</strong>
            {typeof velocity === 'number' && (
              <span className="ml-2 text-bo-neutral-500">
                ·{' '}
                <span
                  className={
                    velocity > 0.02
                      ? 'text-bo-success-dark'
                      : velocity < -0.02
                        ? 'text-bo-warning-dark'
                        : 'text-bo-neutral-500'
                  }
                >
                  {velocity > 0.02
                    ? t('shoppermind.lifecycle.rising')
                    : velocity < -0.02
                      ? t('shoppermind.lifecycle.cooling')
                      : t('shoppermind.lifecycle.holding')}
                </span>
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {ORDER.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={s}
              className={cn(
                'flex-1 relative rounded-md overflow-hidden transition-all',
                isActive
                  ? 'ring-2 ring-bo-primary-600 ring-offset-1 ring-offset-bo-neutral-50'
                  : 'opacity-50',
              )}
            >
              <div className={cn('h-2', HEAT_CLASSES[s])} />
              <div
                className={cn(
                  'text-[10px] font-medium text-center py-1 uppercase tracking-wide',
                  isActive ? 'text-bo-neutral-900' : 'text-bo-neutral-500',
                )}
              >
                {labels[s]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LifecycleContinuumCompact({
  state,
  className,
}: {
  state: PhenomenonStateValue;
  className?: string;
}) {
  const labels = useStateLabels();
  const activeIdx = ORDER.indexOf(state);
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <div className="flex gap-1 items-end">
        {ORDER.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={s}
              className={cn(
                'flex-1 rounded-sm transition-all',
                HEAT_CLASSES[s],
                isActive
                  ? cn('h-3 ring-2 ring-offset-1 ring-offset-white shadow-sm', HEAT_RING[s])
                  : 'h-1.5 opacity-40',
              )}
              aria-label={`${labels[s]}${isActive ? ' ✓' : ''}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] uppercase tracking-wider font-medium">
        {ORDER.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <span
              key={s}
              className={cn(
                'flex-1 text-center truncate',
                isActive ? 'text-bo-neutral-900' : 'text-bo-neutral-300',
              )}
            >
              {labels[s]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
