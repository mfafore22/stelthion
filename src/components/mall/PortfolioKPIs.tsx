/**
 * Portfolio KPIs Component
 * Top-level KPI tiles for portfolio overview
 */

'use client';

import React from 'react';
import { TrendingUp, AlertCircle, Cloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PortfolioKPIsProps {
  totalVisitors: number;
  yoyDelta: number;
  weatherImpact: number;
  alerts: { critical: number; warning: number };
  comfortIndex: number;
}

export function PortfolioKPIs({
  totalVisitors,
  yoyDelta,
  weatherImpact,
  alerts,
  comfortIndex,
}: PortfolioKPIsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Total Visitors */}
      <Card className="p-4">
        <div className="text-sm font-medium text-muted-foreground">Total Visitors</div>
        <div className="mt-2 text-2xl font-bold">{formatNumber(totalVisitors)}</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span>vs plan</span>
        </div>
      </Card>

      {/* YoY Delta */}
      <Card className="p-4">
        <div className="text-sm font-medium text-muted-foreground">YoY Delta</div>
        <div className={cn('mt-2 text-2xl font-bold', yoyDelta >= 0 ? 'text-green-600' : 'text-red-600')}>
          {formatPercent(yoyDelta)}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">vs 2024</div>
      </Card>

      {/* Weather Impact */}
      <Card className="p-4">
        <div className="text-sm font-medium text-muted-foreground">Weather Impact</div>
        <div className="mt-2 text-2xl font-bold text-blue-600">{formatPercent(weatherImpact)}</div>
        <div className="mt-1 text-sm text-muted-foreground">Weather boost</div>
      </Card>

      {/* Active Alerts */}
      <Card className="p-4">
        <div className="text-sm font-medium text-muted-foreground">Active Alerts</div>
        <div className="mt-2 text-2xl font-bold">
          {alerts.critical > 0 && (
            <span className="text-red-600">{alerts.critical} Critical</span>
          )}
          {alerts.critical === 0 && alerts.warning > 0 && (
            <span className="text-yellow-600">{alerts.warning} Warning</span>
          )}
          {alerts.critical === 0 && alerts.warning === 0 && (
            <span className="text-green-600">All Clear</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>{alerts.warning} warnings</span>
        </div>
      </Card>

      {/* WeatherNext Comfort */}
      <Card className="p-4">
        <div className="text-sm font-medium text-muted-foreground">WeatherNext Comfort</div>
        <div className="mt-2 text-2xl font-bold text-green-600">{comfortIndex.toFixed(2)}</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Cloud className="h-3 w-3" />
          <span>Optimal</span>
        </div>
      </Card>
    </div>
  );
}
