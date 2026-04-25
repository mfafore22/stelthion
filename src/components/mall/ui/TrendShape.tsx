/**
 * TrendShape Component
 * Dynamic background shape that visualizes trend direction and intensity
 *
 * Features:
 * - Green upward slope for positive trends
 * - Red downward slope for negative trends
 * - Grey flat bar for neutral trends
 * - Gradient opacity (faded under text, bright at edges)
 * - Steeper angles for stronger trends
 */

'use client';

import { useId } from 'react';

export type TrendShapeIntensity = 'foreground' | 'background';

interface TrendShapeProps {
  /**
   * Percentage change (can be positive or negative)
   * Examples: 8.3, -3.2, 0
   */
  percentageChange: number;
  /**
   * Threshold for considering a trend as "flat" (default: 0.5%)
   */
  flatThreshold?: number;
  /**
   * Visual intensity. `foreground` is the bold KPI-tile look (default).
   * `background` is the muted variant for cards that already have rich
   * content (sparklines, badges, body text).
   */
  intensity?: TrendShapeIntensity;
}

export function TrendShape({
  percentageChange,
  flatThreshold = 0.5,
  intensity = 'foreground',
}: TrendShapeProps) {
  const absChange = Math.abs(percentageChange);
  const isFlat = absChange < flatThreshold;
  const isPositive = percentageChange > 0;

  // Determine colors
  const getColors = () => {
    const isBg = intensity === 'background';
    if (isFlat) {
      return {
        base: '#9ca3af',
        startOpacity: isBg ? 0.08 : 0.3,
        endOpacity: isBg ? 0.08 : 0.3,
      };
    }
    if (isPositive) {
      return {
        base: '#10b981',
        startOpacity: isBg ? 0.05 : 0.2,
        endOpacity: isBg ? 0.22 : 0.6,
      };
    }
    return {
      base: '#ef4444',
      startOpacity: isBg ? 0.05 : 0.2,
      endOpacity: isBg ? 0.22 : 0.6,
    };
  };

  const colors = getColors();

  // Calculate slope angle based on percentage
  // Normalize to a reasonable range: 0-20% change maps to visual angles
  const normalizedChange = Math.min(absChange, 20) / 20; // 0 to 1
  const maxHeight = 80; // Maximum height percentage of the container
  const minHeight = isFlat ? 15 : 20; // Minimum height for visibility

  // For positive: left side low, right side high
  // For negative: left side high, right side low
  const heightRange = maxHeight - minHeight;
  const calculatedHeight = minHeight + (normalizedChange * heightRange);

  let leftHeight: number, rightHeight: number;

  if (isFlat) {
    // Flat bar at bottom
    leftHeight = minHeight;
    rightHeight = minHeight;
  } else if (isPositive) {
    // Upward slope (left low, right high)
    leftHeight = minHeight;
    rightHeight = calculatedHeight;
  } else {
    // Downward slope (left high, right low)
    leftHeight = calculatedHeight;
    rightHeight = minHeight;
  }

  // SVG polygon points (percentage coordinates)
  // Bottom-left, Top-left, Top-right, Bottom-right
  const polygonPoints = `
    0,100
    0,${100 - leftHeight}
    100,${100 - rightHeight}
    100,100
  `;

  // Stable gradient ID per instance (replaces Math.random() to avoid re-render churn).
  const gradientId = `trend-gradient-${useId()}`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              style={{
                stopColor: colors.base,
                stopOpacity: colors.startOpacity
              }}
            />
            <stop
              offset="70%"
              style={{
                stopColor: colors.base,
                stopOpacity: (colors.startOpacity + colors.endOpacity) / 2
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: colors.base,
                stopOpacity: colors.endOpacity
              }}
            />
          </linearGradient>
        </defs>
        <polygon
          points={polygonPoints}
          fill={`url(#${gradientId})`}
        />
      </svg>
    </div>
  );
}
