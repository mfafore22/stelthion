/**
 * Property KPIs Component
 * KPI cards for individual property detail page
 */

'use client';

import React from 'react';
import { MallKPICard } from './ui/MallKPICard';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PropertyKPIsProps {
  currentVisitors: number;
  deltaVsPlan: number;
  weatherImpact: number;
  dwellTime: number;
  dwellDelta: number;
  conversionRate: number;
  conversionDelta: number;
  alerts: any[];
}

export function PropertyKPIs({
  currentVisitors,
  deltaVsPlan,
  weatherImpact,
  dwellTime,
  dwellDelta,
  conversionRate,
  conversionDelta,
  alerts,
}: PropertyKPIsProps) {
  const { t } = useTranslation('mall');
  const formatNumber = (num: number) => {
    // Format like portfolio page: 12.3k, 1.5M, etc.
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  return (
    <>
      {/* Current visitors with gradient background */}
      <MallKPICard
        label={t('kpi.currentVisitors')}
        value={formatNumber(currentVisitors)}
        delta={`${formatPercent(deltaVsPlan)} ${t('kpi.vsPlan')}`}
        deltaType={deltaVsPlan >= 0 ? 'positive' : 'negative'}
        accent="green"
        trendPercentage={deltaVsPlan}
      />

      {/* Dwell Time with gradient background */}
      <MallKPICard
        label={t('kpi.dwellTime')}
        value={`${dwellTime} min`}
        delta={`${formatPercent(dwellDelta)} ${t('kpi.vsBaseline')}`}
        deltaType={dwellDelta >= 0 ? 'positive' : 'negative'}
        accent="blue"
        trendPercentage={dwellDelta}
      />

      {/* Conversion Rate with gradient background */}
      <MallKPICard
        label={t('kpi.conversionRate')}
        value={`${conversionRate.toFixed(1)}%`}
        delta={`${formatPercent(conversionDelta)} ${t('kpi.vsLastWeek')}`}
        deltaType={conversionDelta >= 0 ? 'positive' : 'negative'}
        accent="orange"
        trendPercentage={conversionDelta}
      />

      {/* Active Alerts - keeping old Card design as it has special alert list UI */}
      <Card className="p-4 bg-bo-glass border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-bo-neutral-600 tracking-wide">
          <AlertCircle className="h-4 w-4" />
          <span>{t('kpi.activeAlerts')}</span>
        </div>
        <div className="mt-2 space-y-2">
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span>🟢</span>
              <span className="text-bo-success-dark font-medium">{t('kpi.allSystemsNormal')}</span>
            </div>
          )}
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span>{alert.level === 'warning' ? '🟡' : '🟢'}</span>
              <span
                className={cn(
                  'font-medium',
                  alert.level === 'warning' ? 'text-bo-warning-dark' : 'text-bo-success-dark'
                )}
              >
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
