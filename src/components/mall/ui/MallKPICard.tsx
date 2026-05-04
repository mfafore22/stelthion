/**
 * Mall KPI Card Component
 *
 * Metric display with label, value, and delta indicator
 * Delta types: positive (green), negative (red), neutral (orange/gray)
 * Use cases: Current visitors, dwell time, weather impact, sales metrics
 * Features dynamic trend visualization background when trendPercentage is provided
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendShape } from './TrendShape';

export type DeltaType = 'positive' | 'negative' | 'neutral';
export type AccentTone = 'blue' | 'green' | 'orange' | 'red';

export interface MallKPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * KPI label (e.g., "Current Visitors")
   */
  label: string;
  /**
   * Main KPI value (e.g., "246k")
   */
  value: string | number;
  /**
   * Delta text (e.g., "+6.2% vs plan")
   */
  delta?: string;
  /**
   * Delta type for color coding
   * @default 'neutral'
   */
  deltaType?: DeltaType;
  /**
   * Show trend icon
   * @default true
   */
  showTrendIcon?: boolean;
  /**
   * Optional unit label (e.g., "visitors", "min", "€")
   */
  unit?: string;
  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Accent tone for background/value text
   */
  accent?: AccentTone;
  /**
   * Custom accent color (hex) - overrides preset accent tones
   */
  accentColor?: string;
  /**
   * Trend percentage for dynamic background visualization
   * Positive values create upward slope, negative create downward slope
   * Example: 6.2, -3.2, 0
   */
  trendPercentage?: number;
  surfaceAccent?: { primary: string; secondary: string };
}

const deltaStyles: Record<DeltaType, string> = {
  positive: 'text-bo-success',
  negative: 'text-bo-error',
  neutral: 'text-bo-warning',
};

const TrendIcon: Record<DeltaType, React.ElementType> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

const accentStyles: Record<
  AccentTone,
  {
    wrapper: string;
    value: string;
    badge: string;
  }
> = {
  blue: {
    wrapper: 'bg-bo-glass-subtle border-2 border-bo-info/30 backdrop-blur-xl relative',
    value: 'text-bo-info-dark',
    badge: 'text-bo-info-dark',
  },
  green: {
    wrapper: 'bg-bo-glass-subtle border-2 border-bo-success/30 backdrop-blur-xl relative',
    value: 'text-bo-success-dark',
    badge: 'text-bo-success-dark',
  },
  orange: {
    wrapper: 'bg-bo-glass-subtle border-2 border-bo-warning/30 backdrop-blur-xl relative',
    value: 'text-bo-warning-dark',
    badge: 'text-bo-warning-dark',
  },
  red: {
    wrapper: 'bg-bo-glass-subtle border-2 border-bo-error/30 backdrop-blur-xl relative',
    value: 'text-bo-error-dark',
    badge: 'text-bo-error-dark',
  },
};

export const MallKPICard = React.forwardRef<HTMLDivElement, MallKPICardProps>(
  (
    {
      label,
      value,
      delta,
      deltaType = 'neutral',
      showTrendIcon = true,
      unit,
      loading = false,
      className,
      accent,
      accentColor,
      trendPercentage,
      surfaceAccent,
      ...props
    },
    ref
  ) => {
    const Icon = TrendIcon[deltaType];
    const useCustomColor = !!accentColor && !surfaceAccent;
    const showTrendShape = trendPercentage !== undefined;
    const accentStyle = accent ? accentStyles[accent] : null;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl relative overflow-hidden',
          surfaceAccent && 'bo-surface-subtle border-2 backdrop-blur-xl',
          // Apply glass background for non-custom-color cards
          !surfaceAccent && !useCustomColor && !accent && 'bg-bo-glass border-2 border-bo-neutral-300/60 backdrop-blur-xl',
          // Accent cards get subtle tinted glass
          !surfaceAccent && !useCustomColor && accentStyle && accentStyle.wrapper,
          'bo-surface-hover p-6 shadow-bo-glass-strong',
          className
        )}
        style={
          surfaceAccent
            ? { borderColor: `${surfaceAccent.primary}38` }
            : useCustomColor
            ? {
                background: `rgba(248, 246, 243, 0.88)`,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderColor: `${accentColor}40`,
              }
            : undefined
        }
        {...props}
      >
        {surfaceAccent && (
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${surfaceAccent.primary}, ${surfaceAccent.secondary})` }}
          />
        )}
        {/* Dynamic Trend Background Shape */}
        {showTrendShape && <TrendShape percentageChange={trendPercentage} />}

        {/* Content - with relative positioning to appear above TrendShape */}
        <div className="relative z-10">
          {/* Label */}
          <div className="text-xs font-medium text-bo-neutral-600 uppercase tracking-wider mb-3">
            {label}
          </div>

          {/* Value */}
          {loading ? (
            <div className="h-10 bg-bo-neutral-100 rounded animate-pulse mb-1" />
          ) : (
            <div
              className={cn(
                'text-3xl font-bold mb-2 tracking-tight',
                !useCustomColor && (accentStyle ? accentStyle.value : 'text-bo-neutral-950')
              )}
              style={useCustomColor ? { color: accentColor } : undefined}
            >
              {value}
              {unit && (
                <span className="text-base font-normal text-bo-neutral-500 ml-1">
                  {unit}
                </span>
              )}
            </div>
          )}

          {/* Delta */}
          {delta && !loading && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium tracking-wide',
                !useCustomColor && (accentStyle ? accentStyle.badge : deltaStyles[deltaType])
              )}
              style={useCustomColor ? { color: accentColor } : undefined}
            >
              {showTrendIcon && <Icon className="h-4 w-4" />}
              <span>{delta}</span>
            </div>
          )}

          {/* Loading state for delta */}
          {loading && (
            <div className="h-5 w-32 bg-bo-neutral-100 rounded animate-pulse" />
          )}
        </div>
      </div>
    );
  }
);

MallKPICard.displayName = 'MallKPICard';
