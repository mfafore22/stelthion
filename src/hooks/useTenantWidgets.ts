import { useMemo } from 'react';
import { getTenantConfig } from '@/config/tenants';
import { useTenantScenarioMetrics } from '@/hooks/useTenantScenarioMetrics';
import { getTenantWidgets } from '@/dashboard/widgets/widgetRegistry';
import type { ResolvedWidget } from '@/dashboard/widgets/types';

interface UseTenantWidgetsResult {
  widgets: ResolvedWidget[];
  isLoading: boolean;
  error: string | null;
}

export function useTenantWidgets(): UseTenantWidgetsResult {
  const tenantConfig = useMemo(() => getTenantConfig(), []);
  const { metrics, isLoading, error } = useTenantScenarioMetrics(tenantConfig.key);

  const widgets = useMemo(
    () => getTenantWidgets(tenantConfig.type, metrics),
    [tenantConfig.type, metrics]
  );

  return {
    widgets,
    isLoading,
    error,
  };
}
