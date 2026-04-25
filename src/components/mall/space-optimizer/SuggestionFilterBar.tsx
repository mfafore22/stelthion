'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SpaceSuggestionAction } from '@/lib/space-optimizer/types';

export type SortMode = 'confidence' | 'uplift' | 'lease';

interface SuggestionFilterBarProps {
  actions: SpaceSuggestionAction[];
  activeAction: SpaceSuggestionAction | 'ALL';
  onActionChange: (action: SpaceSuggestionAction | 'ALL') => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  counts: Record<SpaceSuggestionAction | 'ALL', number>;
}

const ALL_ACTIONS: SpaceSuggestionAction[] = ['EXPAND', 'CONVERT', 'MAINTAIN', 'SUNSET'];

export function SuggestionFilterBar({
  activeAction,
  onActionChange,
  sortMode,
  onSortModeChange,
  counts,
}: SuggestionFilterBarProps) {
  const { t } = useTranslation('mall');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-bo-neutral-400 font-semibold mr-1">
          {t('spaceOptimizer.filters.byAction')}
        </span>
        <FilterChip
          active={activeAction === 'ALL'}
          onClick={() => onActionChange('ALL')}
          count={counts.ALL}
        >
          {t('spaceOptimizer.filters.all')}
        </FilterChip>
        {ALL_ACTIONS.map((action) => (
          <FilterChip
            key={action}
            active={activeAction === action}
            onClick={() => onActionChange(action)}
            count={counts[action]}
            variant={action}
          >
            {t(`spaceOptimizer.actions.${action}`)}
          </FilterChip>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-bo-neutral-400 font-semibold mr-1">
          ↕
        </span>
        <SortChip active={sortMode === 'confidence'} onClick={() => onSortModeChange('confidence')}>
          {t('spaceOptimizer.filters.sortByConfidence')}
        </SortChip>
        <SortChip active={sortMode === 'uplift'} onClick={() => onSortModeChange('uplift')}>
          {t('spaceOptimizer.filters.sortByUplift')}
        </SortChip>
        <SortChip active={sortMode === 'lease'} onClick={() => onSortModeChange('lease')}>
          {t('spaceOptimizer.filters.sortByLeaseEnd')}
        </SortChip>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  variant,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: SpaceSuggestionAction;
  children: React.ReactNode;
}) {
  const dotClass =
    variant === 'EXPAND'
      ? 'bg-bo-success'
      : variant === 'CONVERT'
        ? 'bg-bo-info'
        : variant === 'MAINTAIN'
          ? 'bg-bo-neutral-400'
          : variant === 'SUNSET'
            ? 'bg-bo-warning'
            : 'bg-bo-neutral-300';

  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
        active
          ? 'bg-bo-neutral-950 text-white border-bo-neutral-950'
          : 'bg-white/60 text-bo-neutral-700 border-bo-neutral-200 hover:bg-bo-neutral-100',
        count === 0 && 'opacity-40 cursor-not-allowed',
      )}
    >
      {variant && <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />}
      {children}
      <span
        className={cn(
          'ml-0.5 text-[10px] tabular-nums',
          active ? 'text-white/70' : 'text-bo-neutral-400',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
        active
          ? 'bg-bo-neutral-100 text-bo-neutral-950 border-bo-neutral-300'
          : 'bg-transparent text-bo-neutral-500 border-transparent hover:bg-bo-neutral-100',
      )}
    >
      {children}
    </button>
  );
}
