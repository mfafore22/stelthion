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

import React from 'react';

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
}

export function TrendShape({ percentageChange, flatThreshold = 0.5 }: TrendShapeProps) {
  const absChange = Math.abs(percentageChange);
  const isFlat = absChange < flatThreshold;
  const isPositive = percentageChange > 0;

  // Determine colors
  const getColors = () => {
    if (isFlat) {
      return {
        base: '#9ca3af', // gray-400
        startOpacity: 0.3,
        endOpacity: 0.3,
      };
    }
    if (isPositive) {
      return {
        base: '#10b981', // emerald-500
        startOpacity: 0.2, // faded under text
        endOpacity: 0.6,   // bright at edge
      };
    }
    return {
      base: '#ef4444', // red-500
      startOpacity: 0.2, // faded under text
      endOpacity: 0.6,   // bright at edge
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

  // Create gradient ID unique to this instance
  const gradientId = `trend-gradient-${Math.random().toString(36).substr(2, 9)}`;

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
