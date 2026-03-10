'use client';

import { useState, useCallback, useEffect } from 'react';
import { UnifiedScenario } from '@/types/unified-scenario.types';

export interface UseLiveDataOptions {
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Data sources to monitor */
  sources?: string[];
  /** Enable automatic refresh */
  autoRefresh?: boolean;
}

export interface LiveDataState {
  /** Current data snapshot */
  snapshot: any | null;
  /** Data age in milliseconds */
  dataAge: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Data quality metrics */
  quality: any | null;
}

export interface LiveDataActions {
  /** Refresh data snapshot */
  refresh: (fresh?: boolean) => Promise<void>;
  /** Inject live data into scenario */
  injectIntoScenario: (scenario: UnifiedScenario) => Promise<UnifiedScenario>;
  /** Get data for specific sources */
  getSourceData: (sources: string[]) => Promise<any>;
  /** Clear data and state */
  clearData: () => void;
}

export function useLiveData(options: UseLiveDataOptions = {}): LiveDataState & LiveDataActions {
  const {
    refreshInterval = 300000, // 5 minutes
    sources,
    autoRefresh = true
  } = options;

  // State management
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [dataAge, setDataAge] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<any | null>(null);

  // Update data age
  useEffect(() => {
    if (!snapshot) return;

    const updateAge = () => {
      setDataAge(Date.now() - snapshot.capturedAt);
    };

    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [snapshot]);

  // Refresh data snapshot
  const refresh = useCallback(async (fresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fresh) params.append('fresh', 'true');
      if (sources && sources.length > 0) {
        params.append('sources', sources.join(','));
      }

      const response = await fetch(`/api/unified-scenarios/live-data?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch live data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setSnapshot(result.snapshot);
        setDataAge(result.dataAge || 0);
        setQuality(result.snapshot?.dataQuality || null);
      } else {
        throw new Error(result.error || 'Failed to fetch live data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Live data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sources]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh(false); // Don't force fresh on auto-refresh
    }, refreshInterval);

    // Initial load
    refresh(false);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  // Inject live data into scenario
  const injectIntoScenario = useCallback(async (scenario: UnifiedScenario): Promise<UnifiedScenario> => {
    try {
      const response = await fetch('/api/unified-scenarios/live-data/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario }),
      });

      if (!response.ok) {
        throw new Error(`Failed to inject live data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setQuality(result.dataQuality);
        return result.scenario;
      } else {
        throw new Error(result.error || 'Failed to inject live data');
      }
    } catch (err) {
      console.error('Live data injection error:', err);
      throw err;
    }
  }, []);

  // Get data for specific sources
  const getSourceData = useCallback(async (requestedSources: string[]) => {
    try {
      const params = new URLSearchParams();
      params.append('sources', requestedSources.join(','));

      const response = await fetch(`/api/unified-scenarios/live-data?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch source data: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.snapshot : null;
    } catch (err) {
      console.error('Get source data error:', err);
      throw err;
    }
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setSnapshot(null);
    setDataAge(0);
    setQuality(null);
    setError(null);
  }, []);

  return {
    // State
    snapshot,
    dataAge,
    isLoading,
    error,
    quality,

    // Actions
    refresh,
    injectIntoScenario,
    getSourceData,
    clearData
  };
}

export function useDataQuality() {
  const [qualityHistory, setQualityHistory] = useState<Array<{
    timestamp: number;
    sources: Record<string, any>;
    overall: any;
  }>>([]);

  const addQualityReport = useCallback((report: any) => {
    const entry = {
      timestamp: Date.now(),
      sources: report.sources || {},
      overall: report.overall || {}
    };

    setQualityHistory(prev => [entry, ...prev.slice(0, 19)]); // Keep last 20
  }, []);

  const getQualityTrends = useCallback(() => {
    if (qualityHistory.length < 2) return null;

    const recent = qualityHistory.slice(0, 5);
    const older = qualityHistory.slice(5, 10);

    const recentAvg = recent.reduce((sum, entry) => sum + (entry.overall.score || 0), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, entry) => sum + (entry.overall.score || 0), 0) / older.length : recentAvg;

    return {
      trend: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable',
      change: recentAvg - olderAvg,
      current: recentAvg
    };
  }, [qualityHistory]);

  return {
    qualityHistory,
    addQualityReport,
    getQualityTrends
  };
}

export function useDataSourceHealth() {
  const [sourceHealth, setSourceHealth] = useState<Record<string, {
    status: 'online' | 'degraded' | 'offline';
    lastUpdate: number;
    latency: number;
    errorRate: number;
  }>>({});

  const updateSourceHealth = useCallback((sourceName: string, health: any) => {
    setSourceHealth(prev => ({
      ...prev,
      [sourceName]: {
        status: health.status || 'offline',
        lastUpdate: health.lastUpdate || Date.now(),
        latency: health.latency || 0,
        errorRate: health.errorRate || 0
      }
    }));
  }, []);

  const getOverallHealth = useCallback(() => {
    const sources = Object.values(sourceHealth);
    if (sources.length === 0) return 'unknown';

    const onlineCount = sources.filter(s => s.status === 'online').length;
    const degradedCount = sources.filter(s => s.status === 'degraded').length;

    if (onlineCount === sources.length) return 'healthy';
    if (onlineCount + degradedCount === sources.length) return 'degraded';
    return 'critical';
  }, [sourceHealth]);

  return {
    sourceHealth,
    updateSourceHealth,
    getOverallHealth
  };
}
