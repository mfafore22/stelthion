'use client';

import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus, Wand2 } from 'lucide-react';
import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';
import { SourceLogos } from './SourceLogos';
import { MetricTerm } from './MetricTerm';
import { cn } from '@/lib/utils';

interface Props {
  phenomenon: PhenomenonSummary;
  velocity: number;
  ideaOpen: boolean;
  onToggleIdea: () => void;
}

export function PhenomenonCardFooter({ phenomenon, velocity, ideaOpen, onToggleIdea }: Props) {
  const { t } = useTranslation('mall');
  const VelIcon = velocity > 0.02 ? ArrowUpRight : velocity < -0.02 ? ArrowDownRight : Minus;
  const velColor =
    velocity > 0.02
      ? 'text-bo-success-dark bg-bo-success-light border-bo-success/30'
      : velocity < -0.02
        ? 'text-bo-warning-dark bg-bo-warning-light border-bo-warning/30'
        : 'text-bo-neutral-500 bg-bo-neutral-100 border-bo-neutral-200';

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t border-bo-neutral-200/60">
        <span className="text-bo-neutral-500">
          <MetricTerm tooltip={t('shoppermind.tooltips.relevance')}>
            {t('shoppermind.grid.score')}
          </MetricTerm>{' '}
          <strong className="text-bo-neutral-900">
            {phenomenon.compositeScore.toFixed(2)}
          </strong>
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium',
            velColor,
          )}
        >
          <VelIcon className="w-3 h-3" />
          {velocity > 0 ? '+' : ''}
          {velocity.toFixed(2)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <SourceLogos contributingSources={phenomenon.contributingSources} />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleIdea();
          }}
          aria-pressed={ideaOpen}
          aria-label={t('shoppermind.campaignIdea.generate')}
          title={t('shoppermind.campaignIdea.generate')}
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors',
            ideaOpen
              ? 'bg-bo-neutral-950 text-white'
              : 'text-bo-neutral-500 hover:bg-bo-neutral-100 hover:text-bo-neutral-900 border border-bo-neutral-200',
          )}
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
