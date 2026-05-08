/**
 * Alerts Stream Component
 * Recent operational alerts and events
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Alert {
  time: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
}

interface AlertsStreamProps {
  alerts: Alert[];
}

export function AlertsStream({ alerts }: AlertsStreamProps) {
  const { t } = useTranslation('mall');

  const getAlertIcon = (level: string) => {
    if (level === 'warning' || level === 'critical') {
      return <AlertCircle className="h-5 w-5 text-bo-warning-dark" />;
    }
    return <CheckCircle className="h-5 w-5 text-bo-success-dark" />;
  };

  const getAlertColor = (level: string) => {
    if (level === 'critical') return 'text-bo-error-dark';
    if (level === 'warning') return 'text-bo-warning-dark';
    return 'text-bo-success-dark';
  };

  return (
    <Card className="bo-surface rounded-xl border-2 border-bo-primary-200/50 p-6 shadow-bo-glass">
      <div className="mb-4 h-1.5 rounded-full bg-gradient-to-r from-bo-success-dark via-bo-warning-dark to-bo-error-dark" />
      <h3 className="mb-4 text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('alertsStream.title')}</h3>
      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="bo-surface-subtle flex items-center gap-3 rounded-lg border border-bo-success/20 p-3">
            <CheckCircle className="h-5 w-5 text-bo-success-dark" />
            <div>
              <div className="font-medium text-bo-success-dark">{t('alertsStream.allNormal')}</div>
              <div className="text-sm text-bo-neutral-600">{t('alertsStream.noAlerts')}</div>
            </div>
          </div>
        )}
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 rounded-lg p-3 border',
              alert.level === 'warning' && 'bo-surface-subtle border-bo-warning/30',
              alert.level === 'critical' && 'bo-surface-subtle border-bo-error/30',
              alert.level === 'info' && 'bo-surface-subtle border-bo-success/30'
            )}
          >
            {getAlertIcon(alert.level)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-bo-neutral-600" />
                <span className="text-sm text-bo-neutral-600">{alert.time}</span>
              </div>
              <div className={cn('mt-1 font-medium', getAlertColor(alert.level))}>
                {alert.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
