/**
 * Tenant Mix Chart Component
 * Displays retailer type distribution as a visual breakdown
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { useTranslation } from 'react-i18next';

interface TenantMixChartProps {
  retailerTypePercentages: Record<string, number>;
  totalShops: number;
}

// Color mapping for retailer types matching mall theme
const RETAILER_TYPE_COLORS: Record<string, string> = {
  'Food and beverage': '#4169E1', // Primary blue
  'Fashion and accessories': '#00D4AA', // Success green
  'Services': '#FFA94D', // Warning orange
  'Home and interior': '#9b59b6', // Purple
  'Food retail': '#e74c3c', // Red
  'Health and beauty goods': '#f39c12', // Orange
  'Leisure and entertainment': '#3498db', // Light blue
  'Sports and outdoor': '#2ecc71', // Green
  'Technology and electronics': '#34495e', // Dark gray
};

export function TenantMixChart({ retailerTypePercentages, totalShops }: TenantMixChartProps) {
  const { t } = useTranslation('mall');
  const sortedTypes = Object.entries(retailerTypePercentages)
    .sort(([, a], [, b]) => b - a);

  return (
    <MallCard variant="glass">
      <h3 className="text-lg font-semibold text-bo-neutral-950 mb-4 tracking-tight">
        {t('tenants.tenantMixByCategory')}
      </h3>
      <p className="text-sm text-bo-neutral-600 mb-4">
        {t('tenants.distribution', { count: totalShops })}
      </p>

      <div className="space-y-3">
        {sortedTypes.map(([type, percentage]) => {
          const color = RETAILER_TYPE_COLORS[type] || '#94a3b8';
          return (
            <div key={type}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-bo-neutral-700">{t(`tenants.categoryNames.${type}`, { defaultValue: type })}</span>
                <span className="text-sm font-medium text-bo-neutral-950">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-bo-neutral-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </MallCard>
  );
}
