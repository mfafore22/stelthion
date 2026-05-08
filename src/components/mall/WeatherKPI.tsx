/**
 * Weather KPI Component
 * Displays real-time weather impact on portfolio
 * Uses FMI data for the given mall (defaults to Ideapark Lempäälä)
 */

'use client';

import React from 'react';
import { MallKPICard } from './ui/MallKPICard';
import { useWeather } from '@/hooks/mall/useWeather';

interface WeatherKPIProps {
  representativeMallId?: string; // Mall to use for portfolio-wide weather
}

export function WeatherKPI({ representativeMallId = 'ideapark-lempaala' }: WeatherKPIProps) {
  const { weather, isLoading } = useWeather(representativeMallId);

  if (isLoading) {
    return (
      <MallKPICard
        label="Weather Impact"
        value="..."
        delta="Loading..."
        deltaType="neutral"
        accent="orange"
      />
    );
  }

  // Use real weather data
  const impact = weather?.footfallImpact ?? 4.2;
  const temp = weather?.temperature ?? 18;
  const condition = weather?.condition ?? 'Clear';
  const season = weather?.season ?? 'autumn';

  // Format display
  const impactDisplay = `${impact >= 0 ? '+' : ''}${impact.toFixed(1)}%`;
  const weatherSummary = `${condition}, ${Math.round(temp)}°C`;

  // Determine delta type based on impact
  let deltaType: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (impact > 10) deltaType = 'positive';
  else if (impact < -5) deltaType = 'negative';

  // Add seasonal context
  const getSeasonalEmoji = () => {
    switch (season) {
      case 'winter': return '❄️';
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'autumn': return '🍂';
      default: return '';
    }
  };

  return (
    <MallKPICard
      label="Weather Impact"
      value={impactDisplay}
      delta={`${getSeasonalEmoji()} ${weatherSummary}`}
      deltaType={deltaType}
      accent="orange"
    />
  );
}
