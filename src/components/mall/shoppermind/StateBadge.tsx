'use client';

import { useTranslation } from 'react-i18next';
import { Activity, Circle, Pause, TrendingDown, TrendingUp } from 'lucide-react';
import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';
import { cn } from '@/lib/utils';

export function useStateLabels(): Record<PhenomenonStateValue, string> {
  const { t } = useTranslation('mall');
  return {
    EMERGING: t('shoppermind.states.EMERGING'),
    ACCELERATING: t('shoppermind.states.ACCELERATING'),
    STABLE: t('shoppermind.states.STABLE'),
    FADING: t('shoppermind.states.FADING'),
    DORMANT: t('shoppermind.states.DORMANT'),
  };
}

const STATE_ICON: Record<PhenomenonStateValue, React.ComponentType<{ className?: string }>> = {
  EMERGING: Circle,
  ACCELERATING: TrendingUp,
  STABLE: Activity,
  FADING: TrendingDown,
  DORMANT: Pause,
};

const STATE_CLASSES: Record<PhenomenonStateValue, string> = {
  EMERGING: 'bg-bo-info-light text-bo-info-dark border-bo-info/20',
  ACCELERATING: 'bg-bo-success-light text-bo-success-dark border-bo-success/30',
  STABLE: 'bg-bo-neutral-100 text-bo-neutral-700 border-bo-neutral-300',
  FADING: 'bg-bo-warning-light text-bo-warning-dark border-bo-warning/20',
  DORMANT: 'bg-bo-neutral-100 text-bo-neutral-500 border-bo-neutral-200',
};

export function StateBadge({
  state,
  className,
}: {
  state: PhenomenonStateValue;
  className?: string;
}) {
  const labels = useStateLabels();
  const Icon = STATE_ICON[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border',
        'text-xs font-medium uppercase tracking-wider',
        STATE_CLASSES[state],
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {labels[state]}
    </span>
  );
}
