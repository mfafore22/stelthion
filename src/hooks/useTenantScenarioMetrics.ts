import { useEffect, useMemo, useState } from 'react';
import type { TenantScenarioMetrics } from '@/types/tenantScenario';

interface UseTenantScenarioMetricsResult {
  metrics: TenantScenarioMetrics | null;
  isLoading: boolean;
  error: string | null;
}

export function useTenantScenarioMetrics(tenantKey: string | null): UseTenantScenarioMetricsResult {
  const [metrics, setMetrics] = useState<TenantScenarioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey) {
      setMetrics(null);
      return;
    }

    let cancelled = false;

    async function loadMetrics() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tenants/${tenantKey}/scenario-defaults`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to load scenario defaults (${response.status})`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setMetrics(payload.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setMetrics(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      cancelled = true;
    };
  }, [tenantKey]);

  return useMemo(
    () => ({
      metrics,
      isLoading,
      error,
    }),
    [metrics, isLoading, error]
  );
}
