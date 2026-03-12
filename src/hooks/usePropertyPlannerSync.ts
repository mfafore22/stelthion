/**
 * Property-Planner Sync Hook
 *
 * Synchronizes property selection (useDashboardStore) with planner controls (usePlannerControlsStore).
 *
 * This ensures when a dashboard surface updates the selected airport,
 * the UniversalScenarioPlanner automatically tracks the change and re-runs with the new airport.
 *
 * Usage: Call this hook once in UniversalScenarioPlanner component.
 */

import { useEffect, useRef } from 'react';
import { usePropertySelection } from '@/stores/useDashboardStore';
import { usePlannerControlsStore } from '@/stores/usePlannerControlsStore';

export function usePropertyPlannerSync() {
  const { selectedAirport, setSelectedAirport } = usePropertySelection();
  const { currentAirport, changeAirport } = usePlannerControlsStore();

  type SyncOrigin = 'dashboard' | 'planner' | null;
  const lastOriginRef = useRef<SyncOrigin>(null);
  const previousDashboardAirportRef = useRef<string | null | undefined>(undefined);

  // Sync: dashboardStore.selectedAirport → plannerControlsStore.currentAirport
  useEffect(() => {
    const dashboardAirport = selectedAirport?.code ?? null;
    const previousDashboardAirport = previousDashboardAirportRef.current ?? null;
    const dashboardChanged = previousDashboardAirport !== dashboardAirport;
    previousDashboardAirportRef.current = dashboardAirport;

    if (!dashboardAirport) {
      if (lastOriginRef.current === 'dashboard') {
        lastOriginRef.current = null;
      }
      return;
    }

    if (!dashboardChanged && dashboardAirport !== currentAirport) {
      return;
    }

    if (dashboardAirport === currentAirport) {
      if (lastOriginRef.current === 'dashboard') {
        lastOriginRef.current = null;
      }
      return;
    }

    if (lastOriginRef.current === 'planner') {
      lastOriginRef.current = null;
      return;
    }

    lastOriginRef.current = 'dashboard';
    changeAirport(dashboardAirport);
  }, [selectedAirport?.code, currentAirport, changeAirport]);

  // Reverse sync: plannerControlsStore.currentAirport → dashboardStore.selectedAirport
  // This happens when planner changes airport via TopBar
  useEffect(() => {
    if (!currentAirport) {
      if (lastOriginRef.current === 'planner') {
        lastOriginRef.current = null;
      }
      return;
    }

    if (selectedAirport?.code === currentAirport) {
      if (lastOriginRef.current === 'planner') {
        lastOriginRef.current = null;
      }
      return;
    }

    if (lastOriginRef.current === 'dashboard') {
      lastOriginRef.current = null;
      return;
    }

    lastOriginRef.current = 'planner';
    // Create minimal airport option
    const airportOption = {
      code: currentAirport,
      label: currentAirport,
      coords: [0, 0] as [number, number], // Will be updated when full airport data loads
    };
    setSelectedAirport(airportOption);
  }, [currentAirport, selectedAirport?.code, setSelectedAirport]);
}
