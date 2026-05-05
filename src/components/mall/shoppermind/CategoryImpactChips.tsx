'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  categoryLabel,
  type RetailCategoryImpact,
} from '@/lib/shoppermind/retailCategories';

const directionClass = {
  positive: 'border-bo-success/30 bg-bo-success-light/50 text-bo-success-dark',
  negative: 'border-bo-error/30 bg-bo-error-light/50 text-bo-error-dark',
  mixed: 'border-bo-warning/30 bg-bo-warning-light/50 text-bo-warning-dark',
  watch: 'border-bo-neutral-300 bg-bo-neutral-100 text-bo-neutral-700',
};

export function CategoryImpactChips({
  impacts,
  compact = false,
}: {
  impacts: RetailCategoryImpact[];
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation('mall');
  if (!impacts.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {impacts.map((impact) => (
        <span
          key={`${impact.id}-${impact.state}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border font-medium',
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
            directionClass[impact.direction],
          )}
          title={t(`shoppermind.categoryImpact.${impact.state}`)}
        >
          {categoryLabel(impact.id, i18n.language)}
          <span className="text-current/60">
            {t(`shoppermind.categoryImpact.badges.${impact.state}`)}
          </span>
        </span>
      ))}
    </div>
  );
}
