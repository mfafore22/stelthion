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
  EMERGING: 'bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/30',
  ACCELERATING: 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/30',
  STABLE: 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm shadow-amber-400/30',
  FADING: 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-500/30',
  DORMANT: 'bg-bo-neutral-400 text-white border-bo-neutral-500',
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
