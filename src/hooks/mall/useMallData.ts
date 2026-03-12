/**
 * Custom hooks for fetching mall data from API
 */

import { useEffect, useState } from 'react';

export interface MallSummary {
  id: string;
  mall_name: string;
  city: string;
  total_shops: number;
  retailer_type_percentages: Record<string, number>;
  top_categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export interface MallDetail {
  id: string;
  summary: {
    mall_name: string;
    city: string;
    total_shops: number;
    shops_by_retailer_type: Record<string, number>;
    shops_by_category: Record<string, number>;
    retailer_type_percentages: Record<string, number>;
    top_categories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    shops_by_floor?: Record<string, number>;
    collection_date: string;
    data_source: string;
  };
  shops: any[] | null;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch list of all malls
 */
export function useMalls() {
  const [state, setState] = useState<FetchState<MallSummary[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMalls = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch('/api/mall');

        if (!response.ok) {
          throw new Error(`Failed to fetch malls: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch malls');
        }

        setState({ data: result.data, loading: false, error: null });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
      }
    };

    fetchMalls();
  }, []);

  return state;
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

        if (!result.success) {
          throw new Error(result.error || `Failed to fetch mall ${mallId}`);
        }

        setState({ data: result.data, loading: false, error: null });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
      }
    };

    fetchMallDetail();
  }, [mallId]);

  return state;
}
