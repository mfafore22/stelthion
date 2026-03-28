/**
 * Custom hooks for fetching mall data from API
 * Interfaces match the Prisma schema shape returned by /api/mall/[mallId]
 */

import { useEffect, useState } from 'react';

export interface MallCategory {
  name: string;
  shopCount: number;
  percentage: number;
}

export interface MallStats {
  currentVisitors: number;
  annualVisitors: number;
  annualSales: number;
  dwellTime: number;
  conversionRate: number;
}

export interface MallBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface MallDetail {
  mallId: string;
  name: string;
  city: string;
  totalShops: number;
  status: string;
  customerId: string;
  categories: MallCategory[];
  stats: MallStats | null;
  branding: MallBranding | null;
  updatedAt: string;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch detailed data for a specific mall
 */
export function useMallDetail(mallId: string | null) {
  const [state, setState] = useState<FetchState<MallDetail>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!mallId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const fetchMallDetail = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch(`/api/mall/${mallId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch mall ${mallId}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setState({ data: result, loading: false, error: null });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
      }
    };

    fetchMallDetail();
  }, [mallId]);

  return state;
}
