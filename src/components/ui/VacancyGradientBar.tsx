/**
 * Vacancy Gradient Bar
 * Visual indicator showing parking occupancy with a color gradient
 * Green (0-33%) → Orange (34-66%) → Red (67-100%)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface VacancyGradientBarProps {
  /** Occupancy percentage (0-100) */
  percentage: number;
  /** Height of the bar in pixels */
  height?: string;
  /** Optional className for styling */
  className?: string;
}

export function VacancyGradientBar({
  percentage,
  height = '4px',
  className
}: VacancyGradientBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Determine color based on threshold
  const getBarColor = (percent: number): string => {
    if (percent >= 67) return '#ef4444'; // Red (67-100%)
    if (percent >= 34) return '#f97316'; // Orange (34-66%)
    return '#22c55e'; // Green (0-33%)
  };

  return (
    <div
      className={cn(
        'w-full rounded-full overflow-hidden bg-bo-neutral-200',
        className
      )}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedPercentage}% occupancy`}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${clampedPercentage}%`,
          backgroundColor: getBarColor(clampedPercentage),
        }}
      />
    </div>
  );
}
