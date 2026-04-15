'use client';

import { useTranslation } from 'react-i18next';
import { StateBadge } from './StateBadge';
import { TrajectorySparkline } from './TrajectorySparkline';
import { FeedbackChips } from './FeedbackChips';
import { friendlyDescription, categoryLabel } from './helpers';
import type { PhenomenonSummary } from '@/hooks/useShopperMind';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface PhenomenonCardProps {
  phenomenon: PhenomenonSummary;
  userId: string;
  onClick?: () => void;
}

export function PhenomenonCard({ phenomenon: p, userId, onClick }: PhenomenonCardProps) {
  const { t } = useTranslation('mall');
  const latestScore = p.scores?.[0];
  const velocity = latestScore?.velocity ?? 0;
  const VelIcon = velocity > 0.5 ? TrendingUp : velocity < -0.5 ? TrendingDown : Minus;
  const description = friendlyDescription(p.description, p._count.signals, p.categories, t);

  return (
    <div
      onClick={onClick}
      className="rounded-xl border-2 border-bo-neutral-300/60 bg-bo-glass backdrop-blur-xl shadow-bo-glass-strong p-4 cursor-pointer hover:shadow-bo-xl hover:-translate-y-0.5 transition-all duration-300 ease-bo-out-expo"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-bo-neutral-900 truncate">{p.label}</h3>
          <p className="text-xs text-bo-neutral-500 line-clamp-2 mt-0.5">{description}</p>
        </div>
        <StateBadge state={p.state} />
      </div>

      {p.scores.length > 2 && (
        <div className="my-2">
          <TrajectorySparkline
            data={p.scores.map((s) => ({ date: s.date, compositeScore: s.compositeScore }))}
            state={p.state}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-bo-neutral-500">
          <span className="flex items-center gap-1">
            <VelIcon className="h-3 w-3" />
            {velocity > 0 ? '+' : ''}{velocity.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {p._count.signals}
          </span>
        </div>
        <FeedbackChips phenomenonId={p.id} userId={userId} />
      </div>

      {p.categories.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {p.categories.slice(0, 3).map((c) => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-bo-neutral-100 text-bo-neutral-500">
              {categoryLabel(c, t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
