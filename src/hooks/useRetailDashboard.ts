/**
 * useRetailDashboard Hook
 * Fetches retail dashboard data from API endpoint
 *
 * Phase 3C: Currently uses mock data from /api/retail/dashboard
 * Future: Will swap to live RetailOperationsEngine execution
 */

import { useState, useEffect, useCallback } from 'react';

export type TimeRange = '1h' | '6h' | '24h' | '7d';

export interface RetailDashboardData {
  airportCode: string;
  generatedAt: string;
  metrics: {
    totalRevenue: number;
    totalTransactions: number;
    averageBasketSize: number;
    conversionRate: number;
    footfall: number;
    avgDwellMinutes: number;
  };
  variableSnapshot: Record<string, number>;
  dataQuality: {
    completeness: number;
    freshness: number;
    coverage: string[];
  };
}

interface UseRetailDashboardResult {
  data: RetailDashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch retail dashboard data
 *
 * @param airportCode - Airport IATA code (e.g., 'DOH', 'DXB')
 * @param airportClass - Airport classification
 * @param timeRange - Time range for data aggregation
 * @param refreshInterval - Optional auto-refresh interval in ms
 */
export function useRetailDashboard(
  airportCode: string,
  airportClass: 'HUB' | 'LARGE' | 'REGIONAL' | 'MEDIUM' | 'SMALL' = 'HUB',
  timeRange: TimeRange = '24h',
  refreshInterval?: number
): UseRetailDashboardResult {
  const [data, setData] = useState<RetailDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        airport: airportCode,
        class: airportClass,
        timeRange,
      });

      const response = await fetch(`/api/retail/dashboard?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      setData(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('useRetailDashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [airportCode, airportClass, timeRange]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh if interval provided
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Calculate trend direction based on current vs baseline
 */
export function calculateTrend(current: number, baseline: number): 'up' | 'down' | 'neutral' {
  const percentChange = ((current - baseline) / baseline) * 100;

  if (Math.abs(percentChange) < 2) return 'neutral';
  return percentChange > 0 ? 'up' : 'down';
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(current: number, baseline: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
