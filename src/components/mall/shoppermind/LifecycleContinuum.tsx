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
  EMERGING: 'bg-bo-heat-low',
  ACCELERATING: 'bg-bo-heat-mid',
  STABLE: 'bg-bo-heat-high',
  FADING: 'bg-bo-warning',
  DORMANT: 'bg-bo-neutral-300',
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
    <div className={cn('flex gap-0.5 w-full', className)}>
      {ORDER.map((s, i) => {
        const isActive = i === activeIdx;
        return (
          <div
            key={s}
            className={cn(
              'flex-1 h-1.5 rounded-sm',
              HEAT_CLASSES[s],
              !isActive && 'opacity-30',
            )}
            aria-label={`${labels[s]}${isActive ? ' ✓' : ''}`}
          />
        );
      })}
    </div>
  );
}
