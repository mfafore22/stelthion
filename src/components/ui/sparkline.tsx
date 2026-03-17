/**
 * Sparkline Component
 * Lightweight SVG-based trend visualization for KPI cards
 * Accessible and performant
 */

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showDots?: boolean;
  ariaLabel?: string;
}

/**
 * Simple sparkline chart using SVG path
 *
 * @param data - Array of numeric values to plot
 * @param width - Chart width in pixels
 * @param height - Chart height in pixels
 * @param color - Line color (CSS color value)
 * @param showDots - Show dots at data points
 * @param ariaLabel - Accessibility label
 */
export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'currentColor',
  className = '',
  showDots = false,
  ariaLabel = 'Trend chart',
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate min/max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDots &&
        points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={color}
          />
        ))}
    </svg>
  );
}

/**
 * Trend indicator with arrow icon
 */
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  value: number;
  className?: string;
}

export function TrendIndicator({ trend, value, className = '' }: TrendIndicatorProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  const colorClass = isPositive
    ? 'text-green-600'
    : isNegative
    ? 'text-red-600'
    : 'text-gray-500';

  const icon = isPositive ? '↑' : isNegative ? '↓' : '→';

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${colorClass} ${className}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{Math.abs(value).toFixed(1)}%</span>
    </span>
  );
}

/**
 * Generate mock trend data for demonstration
 * Future: Replace with actual historical data from API
 */
export function generateMockTrendData(
  baseValue: number,
  points: number = 12,
  volatility: number = 0.1
): number[] {
  const data: number[] = [];
  let value = baseValue;

  for (let i = 0; i < points; i++) {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.45) * baseValue * volatility;
    value = Math.max(0, value + change);
    data.push(value);
  }

  return data;
}
