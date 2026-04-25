'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Repeat,
  Pause,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { MallCard } from '@/components/mall/ui/MallCard';
import { MallBadge } from '@/components/mall/ui/MallBadge';
import { MallButton } from '@/components/mall/ui/MallButton';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from '@/lib/i18n/formatting';
import type { LanguageCode } from '@/lib/i18n/config';
import type {
  SpaceSuggestion,
  SpaceSuggestionAction,
  DrivingTrendRef,
} from '@/lib/space-optimizer/types';
import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  suggestion: SpaceSuggestion;
  trendIndex: Map<string, DrivingTrendRef>;
  variant?: 'app' | 'demo';
  onDismiss?: (id: string) => void;
}

const ACTION_CONFIG: Record<
  SpaceSuggestionAction,
  {
    icon: typeof TrendingUp;
    badge: 'success' | 'info' | 'planned' | 'warning';
    accent: string;
  }
> = {
  EXPAND: {
    icon: TrendingUp,
    badge: 'success',
    accent: 'border-l-bo-success',
  },
  CONVERT: {
    icon: Repeat,
    badge: 'info',
    accent: 'border-l-bo-info',
  },
  MAINTAIN: {
    icon: Pause,
    badge: 'planned',
    accent: 'border-l-bo-neutral-400',
  },
  SUNSET: {
    icon: AlertOctagon,
    badge: 'warning',
    accent: 'border-l-bo-warning',
  },
};

export function SuggestionCard({
  suggestion,
  trendIndex,
  variant = 'app',
  onDismiss,
}: SuggestionCardProps) {
  const { t, i18n } = useTranslation('mall');
  const lang = (i18n.language?.split('-')[0] ?? 'en') as LanguageCode;

  const config = ACTION_CONFIG[suggestion.action];
  const Icon = config.icon;
  const rationale =
    suggestion.rationale[lang as 'en' | 'fi' | 'sv'] ??
    suggestion.rationale.en;

  const trends = suggestion.drivingTrendIds
    .map((id) => trendIndex.get(id))
    .filter((x): x is DrivingTrendRef => Boolean(x));

  return (
    <MallCard
      variant="glass"
      padding="md"
      className={cn('h-full border-l-4', config.accent)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center',
              suggestion.action === 'EXPAND' && 'bg-bo-success-light text-bo-success-dark',
              suggestion.action === 'CONVERT' && 'bg-bo-info-light text-bo-info-dark',
              suggestion.action === 'MAINTAIN' && 'bg-bo-neutral-100 text-bo-neutral-700',
              suggestion.action === 'SUNSET' && 'bg-bo-warning-light text-bo-warning-dark',
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
          <MallBadge variant={config.badge}>
            {t(`spaceOptimizer.actions.${suggestion.action}`)}
          </MallBadge>
        </div>
        <div className="text-xs text-bo-neutral-400 uppercase tracking-wider font-medium">
          {suggestion.zoneFloor}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-bo-neutral-950 leading-tight tracking-tight mb-1">
        {suggestion.zoneName}
      </h3>
      <div className="text-xs text-bo-neutral-500 mb-3">
        <span className="text-bo-neutral-400">
          {t('spaceOptimizer.card.currentCategory')}:{' '}
        </span>
        <span className="text-bo-neutral-700 font-medium">
          {suggestion.currentCategory}
        </span>
        {suggestion.proposedCategory && (
          <>
            <ArrowRight className="inline w-3 h-3 mx-1.5 text-bo-neutral-400" />
            <span className="text-bo-neutral-900 font-semibold">
              {suggestion.proposedCategory}
            </span>
          </>
        )}
      </div>

      <p className="text-sm text-bo-neutral-700 leading-relaxed mb-4">
        {rationale}
      </p>

      {trends.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 font-medium mb-1.5">
            {t('spaceOptimizer.card.drivingTrends')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trends.map((trend) =>
              variant === 'app' ? (
                <Link
                  key={trend.id}
                  href={`/mall/shoppermind/phenomenon/${encodeURIComponent(trend.id)}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-bo-neutral-100 text-bo-neutral-700 border border-bo-neutral-200 hover:bg-bo-neutral-200 transition-colors"
                >
                  {trend.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span
                  key={trend.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-bo-neutral-100 text-bo-neutral-700 border border-bo-neutral-200"
                >
                  {trend.label}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-bo-neutral-200/60 text-xs">
        <Stat
          label={t('spaceOptimizer.card.confidence')}
          value={formatPercentage(suggestion.confidence * 100, lang, 0)}
        />
        <Stat
          label={t('spaceOptimizer.card.projectedUplift')}
          value={
            suggestion.projectedUpliftPct != null
              ? `+${suggestion.projectedUpliftPct}%`
              : '—'
          }
          valueClass={
            suggestion.projectedUpliftPct != null && suggestion.projectedUpliftPct > 0
              ? 'text-bo-success-dark'
              : ''
          }
        />
        <Stat
          label={
            suggestion.projectedAnnualEur != null
              ? '€/yr'
              : t('spaceOptimizer.card.leaseEnds', { date: '' }).replace(' .', '')
          }
          value={
            suggestion.projectedAnnualEur != null
              ? formatCurrency(suggestion.projectedAnnualEur, lang)
              : suggestion.leaseEndsOn
                ? formatDate(suggestion.leaseEndsOn, lang, 'short')
                : '—'
          }
        />
      </div>

      {(suggestion.tenantName || suggestion.leaseEndsOn) && (
        <div className="mt-3 text-xs text-bo-neutral-500 flex items-center justify-between gap-2">
          {suggestion.tenantName && (
            <span>
              <span className="text-bo-neutral-400">
                {t('spaceOptimizer.card.tenant')}:{' '}
              </span>
              <span className="text-bo-neutral-700 font-medium">
                {suggestion.tenantName}
              </span>
            </span>
          )}
          {suggestion.leaseEndsOn && suggestion.projectedAnnualEur != null && (
            <span className="text-bo-neutral-400">
              {t('spaceOptimizer.card.leaseEnds', {
                date: formatDate(suggestion.leaseEndsOn, lang, 'short'),
              })}
            </span>
          )}
        </div>
      )}

      {variant === 'app' && (
        <div className="mt-4 pt-3 border-t border-bo-neutral-200/60 flex items-center justify-end gap-2">
          {onDismiss && (
            <MallButton
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(suggestion.id)}
            >
              {t('spaceOptimizer.card.dismiss')}
            </MallButton>
          )}
          <MallButton variant="secondary" size="sm">
            {t('spaceOptimizer.card.accept')}
          </MallButton>
        </div>
      )}

      {suggestion.projectedAnnualEur != null && (
        <div className="mt-2 text-[10px] text-bo-neutral-400 italic text-right">
          {t('spaceOptimizer.card.projection')}
        </div>
      )}
    </MallCard>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 font-medium">
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-semibold text-bo-neutral-900 mt-0.5',
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}
