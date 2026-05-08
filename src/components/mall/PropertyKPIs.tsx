/**
 * Property KPIs Component
 * KPI cards for individual property detail page
 */

'use client';

import React from 'react';
import { MallKPICard } from './ui/MallKPICard';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PropertyKPIsProps {
  currentVisitors: number | null;
  deltaVsPlan: number | null;
  weatherImpact: number;
  dwellTime: number | null;
  dwellDelta: number;
  conversionRate: number | null;
  conversionDelta: number;
  alerts: PropertyKPIAlert[];
  hasRealData?: boolean;
  isEstimated?: boolean;
}

interface PropertyKPIAlert {
  level: 'warning' | 'info';
  message: string;
}

export function PropertyKPIs({
  currentVisitors,
  deltaVsPlan,
  dwellTime,
  dwellDelta,
  conversionRate,
  conversionDelta,
  alerts,
  isEstimated,
}: PropertyKPIsProps) {
  const { t } = useTranslation('mall');
  const formatNumber = (num: number) => {
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

  const visitorValue = currentVisitors != null
    ? (isEstimated ? `~${formatNumber(currentVisitors)}` : formatNumber(currentVisitors))
    : '--';

  const deltaLabel = deltaVsPlan != null
    ? `${formatPercent(deltaVsPlan)} ${isEstimated ? t('kpi.avgVsLastYear', 'avg vs last year') : t('kpi.vsLastYear', 'vs last year')}`
    : '--';

  return (
    <>
      {/* Current visitors with gradient background */}
      <MallKPICard
        label={t('kpi.currentVisitors')}
        value={visitorValue}
        delta={deltaLabel}
        deltaType={deltaVsPlan != null && deltaVsPlan >= 0 ? 'positive' : 'negative'}
        accent="green"
        trendPercentage={deltaVsPlan ?? 0}
      />

      {/* Dwell Time with gradient background */}
      <div className={cn(dwellTime == null && 'opacity-60')}>
        <MallKPICard
          label={t('kpi.dwellTime')}
          value={dwellTime != null ? `${dwellTime} min` : '--'}
          delta={dwellTime != null ? `${formatPercent(dwellDelta)} ${t('kpi.vsBaseline')}` : t('kpi.notAvailable', 'Not available')}
          deltaType={dwellTime != null && dwellDelta >= 0 ? 'positive' : 'neutral'}
          accent="blue"
          trendPercentage={dwellTime != null ? dwellDelta : 0}
        />
      </div>

      {/* Conversion Rate with gradient background */}
      <div className={cn(conversionRate == null && 'opacity-60')}>
        <MallKPICard
          label={t('kpi.conversionRate')}
          value={conversionRate != null ? `${conversionRate.toFixed(1)}%` : '--'}
          delta={conversionRate != null ? `${formatPercent(conversionDelta)} ${t('kpi.vsLastWeek')}` : t('kpi.notAvailable', 'Not available')}
          deltaType={conversionRate != null && conversionDelta >= 0 ? 'positive' : 'neutral'}
          accent="orange"
          trendPercentage={conversionRate != null ? conversionDelta : 0}
        />
      </div>

      <Card className="bo-surface-subtle bo-surface-hover relative overflow-hidden rounded-xl border-2 border-bo-neutral-200/60 p-6 shadow-bo-glass-strong backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-bo-warning via-bo-primary-400 to-bo-success" />
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-bo-neutral-600">
          <AlertCircle className="h-4 w-4" />
          <span>{t('kpi.activeAlerts')}</span>
        </div>
        <div className="mt-4 space-y-3">
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-bo-success" />
              <span className="text-bo-success-dark font-medium">{t('kpi.allSystemsNormal')}</span>
            </div>
          )}
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {alert.level === 'warning' ? (
                <AlertCircle className="h-4 w-4 text-bo-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-bo-success" />
              )}
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
