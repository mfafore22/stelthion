/**
 * Top Categories Table Component
 * Displays top retail categories by count and percentage
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { useTranslation } from 'react-i18next';

interface TopCategory {
  category: string;
  count: number;
  percentage: number;
}

interface TopCategoriesTableProps {
  categories: TopCategory[];
  limit?: number;
}

export function TopCategoriesTable({ categories, limit = 10 }: TopCategoriesTableProps) {
  const { t } = useTranslation('mall');
  const displayCategories = categories.slice(0, limit);

  return (
    <MallCard variant="glass">
      <h3 className="text-lg font-semibold text-bo-neutral-950 mb-4 tracking-tight">
        {t('tenants.topCategories')}
      </h3>

      <div className="overflow-hidden rounded-lg border border-bo-neutral-200/30">
        <table className="w-full">
          <thead className="bg-bo-glass-subtle">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-bo-neutral-600 uppercase tracking-wider">
                {t('tenants.category')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-bo-neutral-600 uppercase tracking-wider">
                {t('tenants.spaces')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-bo-neutral-600 uppercase tracking-wider">
                {t('tenants.percentOfTotal')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/40 divide-y divide-bo-neutral-200/30">
            {displayCategories.map((category, index) => (
              <tr key={category.category} className="hover:bg-bo-glass-subtle/50 transition-colors">
                <td className="px-4 py-3 text-sm text-bo-neutral-950">
                  <div className="flex items-center gap-2">
                    <span className="text-bo-neutral-500 font-mono text-xs">
                      {index + 1}.
                    </span>
                    {category.category}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-bo-neutral-950 text-right font-medium">
                  {category.count}
                </td>
                <td className="px-4 py-3 text-sm text-bo-neutral-700 text-right">
                  {category.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length > limit && (
        <p className="text-xs text-bo-neutral-600 mt-2">
          {t('tenants.showingOf', { limit, total: categories.length })}
        </p>
      )}
    </MallCard>
  );
}
