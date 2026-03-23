/**
 * useWeather Hook
 * Fetches real-time weather data for mall locations with seasonal and time-of-day accuracy
 *
 * Features:
 * - Real weather data from OpenWeatherMap API
 * - Automatic mall location to coordinates mapping
 * - Seasonal and time-of-day variations
 * - Weather impact calculations on foot traffic
 * - Caching with SWR (refresh every 10 minutes)
 */

'use client';

import useSWR from 'swr';
import {
  WeatherData,
  MALL_COORDINATES,
  calculateComfortIndex,
  calculateFootfallImpact,
  getSeason,
  getTimeOfDay,
  getMallCoordinates,
} from '@/lib/weather/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Re-export for backwards compatibility
export type { WeatherData };
export {
  MALL_COORDINATES,
  calculateComfortIndex,
  calculateFootfallImpact,
  getSeason,
  getTimeOfDay,
  getMallCoordinates,
};

/**
 * Main hook to fetch weather data for a mall
 */
export function useWeather(mallId: string) {
  const { data, error, isLoading } = useSWR(
    mallId ? `/api/weather/current?mallId=${mallId}` : null,
    fetcher,
    {
      refreshInterval: 600000, // Refresh every 10 minutes
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Dedupe requests within 5 minutes
    }
  );

  return {
    weather: data as WeatherData | undefined,
    isLoading,
    isError: error,
  };
}

/**
 * Hook to fetch weather forecast (next 5 days)
 */
export function useWeatherForecast(mallId: string) {
  const { data, error, isLoading } = useSWR(
    mallId ? `/api/weather/forecast?mallId=${mallId}` : null,
    fetcher,
    {
      refreshInterval: 3600000, // Refresh every hour
      revalidateOnFocus: false,
    }
  );

  return {
    forecast: data as WeatherData[] | undefined,
    isLoading,
    isError: error,
  };
}

