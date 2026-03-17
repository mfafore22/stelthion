/**
 * Mall Card Component
 * Individual mall card showing KPIs, alerts, and competitor comparison
 */

'use client';

import React from 'react';
import { ChevronRight, TrendingUp, AlertCircle, Cloud, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Mall {
  id: string;
  name: string;
  city: string;
  currentVisitors: number;
  deltaVsPlan: number;
  weatherImpact: number;
  alerts: { critical: number; warning: number; message: string };
  nearestRival: { name: string; footfallDelta: number; dwellDelta: number };
  status: string;
}

interface MallCardProps {
  mall: Mall;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function MallCard({ mall, onSelect, isSelected }: MallCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getStatusIcon = () => {
    if (mall.alerts.critical > 0) return '🔴';
    if (mall.alerts.warning > 0) return '🟡';
    return '🟢';
  };

  return (
    <Card
      className={cn(
        'cursor-pointer p-4 transition-all hover:border-primary hover:shadow-md',
        isSelected && 'border-primary shadow-md'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        {/* Left: Mall Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {mall.status === 'LIVE' && <span className="text-lg">⭐</span>}
            <h3 className="text-lg font-semibold">
              {mall.name}, {mall.city}
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {mall.status}
            </span>
          </div>

          {/* KPIs Row */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatNumber(mall.currentVisitors)} visitors</span>
            </div>
            <div className={cn('font-medium', mall.deltaVsPlan >= 0 ? 'text-green-600' : 'text-red-600')}>
              Δ {formatPercent(mall.deltaVsPlan)} vs plan
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <Cloud className="h-4 w-4" />
              <span>Weather {formatPercent(mall.weatherImpact)}</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>{getStatusIcon()}</span>
            <span
              className={cn(
                'font-medium',
                mall.alerts.critical > 0 && 'text-red-600',
                mall.alerts.warning > 0 && 'text-yellow-600',
                mall.alerts.critical === 0 && mall.alerts.warning === 0 && 'text-green-600'
              )}
            >
              {mall.alerts.message}
            </span>
          </div>

          {/* Competitor Comparison */}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>📊</span>
            <span>
              vs {mall.nearestRival.name}: {formatPercent(mall.nearestRival.footfallDelta)} footfall,{' '}
              {formatPercent(mall.nearestRival.dwellDelta)} dwell
            </span>
          </div>
        </div>

        {/* Right: Details Button */}
        <Link href={`/mall/${mall.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
