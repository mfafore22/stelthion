/**
 * Portfolio Map Component
 * Finland map showing mall locations with performance indicators
 * Includes catchment overlay toggle
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Mall {
  id: string;
  name: string;
  city: string;
  currentVisitors: number;
  deltaVsPlan: number;
  coordinates: { lat: number; lng: number };
}

interface PortfolioMapProps {
  malls: Mall[];
  selectedMall: string | null;
  showCatchment: boolean;
  onMallSelect: (mallId: string) => void;
  onCatchmentToggle: (show: boolean) => void;
}

export function PortfolioMap({
  malls,
  selectedMall,
  showCatchment,
  onMallSelect,
  onCatchmentToggle,
}: PortfolioMapProps) {
  const selected = malls.find((m) => m.id === selectedMall);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getPerformanceColor = (delta: number) => {
    if (delta >= 5) return 'bg-green-500';
    if (delta >= 0) return 'bg-blue-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-xl font-semibold">Portfolio Map</h2>

      {/* Catchment Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCatchment}
            onChange={(e) => onCatchmentToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">Show Catchment View</span>
        </label>
      </div>

      {/* Map Placeholder */}
      <Card className="mb-4 flex flex-1 items-center justify-center bg-muted/50 p-8">
        <div className="text-center">
          <div className="mb-4 text-4xl font-bold text-primary">Finland Map</div>
          <div className="space-y-2">
            {malls.slice(0, 5).map((mall) => (
              <button
                key={mall.id}
                onClick={() => onMallSelect(mall.id)}
                className={cn(
                  'block w-full rounded-md px-4 py-2 text-left text-sm transition-all hover:bg-background',
                  selectedMall === mall.id && 'bg-primary/10'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded-full', getPerformanceColor(mall.deltaVsPlan))} />
                  <span className="font-medium">{mall.name}</span>
                  <span className="text-muted-foreground">({mall.city})</span>
                </div>
                <div className="ml-5 text-xs text-muted-foreground">
                  {formatPercent(mall.deltaVsPlan)} vs plan
                </div>
              </button>
            ))}
          </div>
          {showCatchment && (
            <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs dark:bg-blue-950">
              <div className="font-medium">Catchment Overlay Active</div>
              <div className="text-muted-foreground">Showing 15/30min drive-time polygons</div>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Mall Info */}
      {selected && (
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Selected Mall</div>
          <div className="mt-2 font-semibold">{selected.name}</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">{formatNumber(selected.currentVisitors)} visitors</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">vs Plan:</span>
              <span
                className={cn(
                  'font-medium',
                  selected.deltaVsPlan >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPercent(selected.deltaVsPlan)}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/mall/${selected.id}`}>Open Detail View</a>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/mall/${selected.id}/scenario`}>Run Scenario</a>
            </Button>
          </div>
          {showCatchment && (
            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catchment (15min):</span>
                <span className="font-medium">420k people</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competitors (5km):</span>
                <span className="font-medium">3 malls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Performance:</span>
                <span className="font-medium text-green-600">Top quartile</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
