'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createScenarioEngine, ScenarioInputs, ScenarioBatch } from '@/lib/whatif/engine/scenarioEngine';
import {
  getScenarioProfile,
  applyScenarioDefaults,
  validateScenarioConstraints,
  getScenarioPresets,
  type ScenarioProfile
} from '@/lib/whatif/config/scenarioProfiles';
import { SCENARIO_VARIABLES, getControllableVariables } from '@/lib/whatif/registry/scenarioVariables';
import { getDohBaselineVariables as getDefaultBaselineVariables } from '@/lib/airportDb/dohBaselineAdapter';
import type { ValidationIssue } from '@/lib/whatif/validation/schemaAssertions';
import type { AccuracyReport } from '@/lib/whatif/validation/accuracy';
import { getTenantConfig } from '@/config/tenants';
import { useTenantScenarioMetrics } from '@/hooks/useTenantScenarioMetrics';
import type { TenantScenarioMetrics } from '@/types/tenantScenario';
import type { TenantType } from '@/types/tenant';

export interface UseScenarioEngineOptions {
  /** Scenario profile identifier to initialize with */
  initialProfileId?: string;
  /** Number of scenarios to run by default */
  defaultScenarioCount?: number;
  /** Auto-run scenarios when variables change */
  autoRun?: boolean;
  /** Debounce delay for auto-run (ms) */
  debounceMs?: number;
}

export interface ScenarioEngineState {
  /** Currently selected scenario profile */
  currentProfile: string | null;
  /** @deprecated legacy alias for components not yet migrated */
  currentAirport: string | null;
  /** Scenario profile configuration */
  profileConfig: ScenarioProfile | null;
  /** @deprecated legacy alias for components not yet migrated */
  airportConfig: ScenarioProfile | null;
  /** Current variable values */
  variables: Record<string, number>;
  /** Time horizon in hours */
  timeHorizonHours: number;
  /** Scenario execution results */
  results: ScenarioBatch | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Performance metrics */
  performance: {
    lastExecutionTime: number;
    averageExecutionTime: number;
    totalExecutions: number;
  };
}

export interface ScenarioValidationTotals {
  fieldsTested: number;
  issues: number;
  typeIssues: number;
  rangeIssues: number;
  dependencyIssues: number;
}

export interface ScenarioValidationMeta {
  profileId: string;
  scenarioCount: number;
  defaultsApplied: number;
  evaluatedAt: string;
  preset: string | null;
  timeHorizonHours: number;
}

export interface ScenarioValidationResult {
  status: 'pass' | 'warn' | 'fail';
  totals: ScenarioValidationTotals;
  issues: ValidationIssue[];
  meta: ScenarioValidationMeta;
  diagnostics?: ScenarioValidationDiagnostics;
}

export interface ScenarioValidationOptions {
  scenarioCount?: number;
  extensions?: Record<string, unknown>;
  signal?: AbortSignal;
  preset?: string;
}

export interface ValidationEngineResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationDryRunSummary {
  sampleCount: number;
  totalExecutionTime: number;
  mean: Record<string, number>;
  p5: Record<string, number>;
  p95: Record<string, number>;
  perScenarioMs: number;
}

export type ValidationConsistencyType = 'capacity' | 'throughput' | 'staffing';

export interface ValidationConsistencyIssue {
  type: ValidationConsistencyType;
  field: string;
  message: string;
}

export interface ValidationConsistencyReport {
  status: 'pass' | 'warn';
  issues: ValidationConsistencyIssue[];
}

export interface ScenarioValidationDiagnostics {
  schemaStatus: 'pass' | 'warn' | 'fail';
  engineValidation: ValidationEngineResult;
  consistency: ValidationConsistencyReport;
  dryRun: ValidationDryRunSummary | null;
  dryRunError: string | null;
  accuracy: AccuracyReport;
}

export function formatEngineErrorMessage(rawMessage: string): string {
  if (!rawMessage) {
    return 'Scenario execution failed.';
  }

  const normalised = rawMessage.toLowerCase();

  if (normalised.includes('no successful scenarios in batch')) {
    return 'Scenario inputs produced no feasible runs. Increase capacity or relax demand constraints, then try again.';
  }

  return rawMessage;
}

export interface ScenarioEngineActions {
  /** Set the current scenario profile */
  setProfile: (profileId: string) => void;
  /** @deprecated legacy alias for components not yet migrated */
  setAirport: (profileId: string) => void;
  /** Update variable values */
  updateVariables: (updates: Record<string, number>) => void;
  /** Set the simulation time horizon in hours */
  setTimeHorizonHours: (hours: number | null) => void;
  /** Reset variables to scenario defaults */
  resetToDefaults: () => void;
  /** Load a scenario preset */
  loadPreset: (presetName: string) => void;
  /** Execute scenarios manually */
  executeScenarios: (scenarioCount?: number) => Promise<void>;
  /** Run validation against current scenario configuration */
  validateScenario: (options?: ScenarioValidationOptions) => Promise<ScenarioValidationResult>;
  /** Export current scenario */
  exportScenario: () => ScenarioInputs;
  /** Import scenario configuration */
  importScenario: (scenario: ScenarioInputs) => void;
  /** Clear results */
  clearResults: () => void;
}

export function useScenarioEngine(options: UseScenarioEngineOptions = {}): ScenarioEngineState & ScenarioEngineActions {
  const {
    initialProfileId = 'DOH',
    defaultScenarioCount = 100,
    autoRun = false,
    debounceMs = 1000
  } = options;

  // State management
  const [currentProfile, setCurrentProfile] = useState<string | null>(initialProfileId);
  const [variables, setVariables] = useState<Record<string, number>>({});
  const BASELINE_HORIZON_HOURS = 8;
  const [timeHorizonHours, setInternalTimeHorizon] = useState<number>(BASELINE_HORIZON_HOURS);
  const [results, setResults] = useState<ScenarioBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState({
    lastExecutionTime: 0,
    averageExecutionTime: 0,
    totalExecutions: 0
  });
  const executeScenariosRef = useRef<ScenarioEngineActions['executeScenarios'] | null>(null);

  const schemaDefaults = useMemo(() => {
    return SCENARIO_VARIABLES.reduce<Record<string, number>>((acc, variable) => {
      acc[variable.key] = Number(variable.default) ?? 0;
      return acc;
    }, {});
  }, []);

  const applySchemaDefaults = useCallback((values: Record<string, number>) => {
    return {
      ...schemaDefaults,
      ...values
    };
  }, [schemaDefaults]);

  const updateTimeHorizon = useCallback((hours: number | null | undefined) => {
    if (hours == null || Number.isNaN(hours)) {
      setInternalTimeHorizon(BASELINE_HORIZON_HOURS);
      return;
    }

    if (!Number.isFinite(hours)) {
      setInternalTimeHorizon(BASELINE_HORIZON_HOURS);
      return;
    }

    const sanitised = Math.max(1, Math.min(168, Number(hours)));
    const rounded = Math.round(sanitised * 10) / 10;
    setInternalTimeHorizon(rounded);
  }, []);

  // Memoized engine instance
  const engine = useMemo(() => createScenarioEngine(), []);

  // Get current scenario profile configuration
  const profileConfig = useMemo(() => {
    return currentProfile ? getScenarioProfile(currentProfile) : null;
  }, [currentProfile]);

  // Initialize variables when the scenario profile changes
  useEffect(() => {
    if (currentProfile && profileConfig) {
      const defaultVars = applyScenarioDefaults(currentProfile, {});
      const baseline = currentProfile.toUpperCase() === 'DOH'
        ? getDefaultBaselineVariables(new Date())
        : {};
      const presets = getScenarioPresets(currentProfile);
      const normalPreset = presets.find(preset => preset.name === 'Normal Operations');
      const merged = normalPreset
        ? { ...defaultVars, ...baseline, ...normalPreset.variables }
        : { ...defaultVars, ...baseline };
      const presetHorizon = normalPreset?.timeHorizonHours ?? BASELINE_HORIZON_HOURS;
      setVariables(applySchemaDefaults(merged));
      updateTimeHorizon(presetHorizon);
      setError(null);
    }
  }, [currentProfile, profileConfig, updateTimeHorizon, applySchemaDefaults]);

  // Actions
  const setProfile = useCallback((profileId: string) => {
    const config = getScenarioProfile(profileId);
    if (!config) {
      setError(`Unsupported scenario profile: ${profileId}`);
      return;
    }
    setCurrentProfile(profileId);
    setResults(null);
    setError(null);
  }, []);

  const updateVariables = useCallback((updates: Record<string, number>) => {
    setVariables(prev => {
      const newVariables = { ...prev, ...updates };

      // Validate against profile constraints
      if (currentProfile) {
        const validation = validateScenarioConstraints(currentProfile, newVariables);
        if (!validation.valid) {
          setError(`Constraint violations: ${validation.violations.join(', ')}`);
          return prev; // Don't update if invalid
        }
      }

      setError(null);
      return newVariables;
    });
  }, [currentProfile]);

  const resetToDefaults = useCallback(() => {
    if (currentProfile) {
      const defaultVars = applyScenarioDefaults(currentProfile, {});
      const baseline = currentProfile.toUpperCase() === 'DOH'
        ? getDefaultBaselineVariables(new Date())
        : {};
      const presets = getScenarioPresets(currentProfile);
      const normalPreset = presets.find(preset => preset.name === 'Normal Operations');
      const merged = normalPreset
        ? { ...defaultVars, ...baseline, ...normalPreset.variables }
        : { ...defaultVars, ...baseline };
      const presetHorizon = normalPreset?.timeHorizonHours ?? BASELINE_HORIZON_HOURS;
      setVariables(applySchemaDefaults(merged));
      updateTimeHorizon(presetHorizon);
      setError(null);
    }
  }, [currentProfile, updateTimeHorizon, applySchemaDefaults]);

  const loadPreset = useCallback((presetName: string) => {
    if (!currentProfile) return;

    const presets = getScenarioPresets(currentProfile);
    const preset = presets.find(p => p.name === presetName);

    if (preset) {
      setVariables(applySchemaDefaults(preset.variables));
      updateTimeHorizon(preset.timeHorizonHours ?? BASELINE_HORIZON_HOURS);
      setError(null);
    } else {
      setError(`Preset not found: ${presetName}`);
    }
  }, [currentProfile, updateTimeHorizon, applySchemaDefaults]);

  const executeScenarios = useCallback(async (scenarioCount = defaultScenarioCount) => {
    if (!currentProfile || Object.keys(variables).length === 0) {
      setError('Airport and variables must be set');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = window.performance.now();

      const scenarioInputs: ScenarioInputs = {
        variables,
        duration: timeHorizonHours,
        airport: currentProfile,
        name: `${currentProfile} What-If Analysis`
      };

      const batch = engine.executeBatch(scenarioInputs, scenarioCount);
      const endTime = window.performance.now();
      const executionTime = endTime - startTime;

      // Update performance metrics
      setPerformance(prev => ({
        lastExecutionTime: executionTime,
        averageExecutionTime: (prev.averageExecutionTime * prev.totalExecutions + executionTime) / (prev.totalExecutions + 1),
        totalExecutions: prev.totalExecutions + 1
      }));

      setResults(batch);

      // Check for performance warnings
      if (executionTime > 10000) { // 10 seconds
        console.warn(`Scenario execution took ${executionTime.toFixed(0)}ms - consider reducing scenario count`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scenario execution failed';
      setError(formatEngineErrorMessage(message));
      console.error('Scenario execution error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile, variables, defaultScenarioCount, engine, timeHorizonHours]);

  useEffect(() => {
    executeScenariosRef.current = executeScenarios;
  }, [executeScenarios]);

  // Auto-run scenarios when variables change (with debounce)
  useEffect(() => {
    if (!autoRun || !currentProfile || Object.keys(variables).length === 0) return;

    const timeoutId = setTimeout(() => {
      if (executeScenariosRef.current) {
        void executeScenariosRef.current();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [variables, autoRun, debounceMs, currentProfile]);

  const validateScenario = useCallback(async (
    options: ScenarioValidationOptions = {}
  ): Promise<ScenarioValidationResult> => {
    if (!currentProfile) {
      throw new Error('Airport must be set before running validation');
    }

    const payload: Record<string, unknown> = {
      airport: currentProfile,
      scenarioCount: options.scenarioCount ?? defaultScenarioCount,
      variables,
      extensions: options.extensions ?? {},
      preset: options.preset
    };

    if (timeHorizonHours !== BASELINE_HORIZON_HOURS) {
      payload.timeHorizonHours = timeHorizonHours;
    }

    const response = await fetch('/api/unified-scenarios/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: options.signal
    });

    if (!response.ok) {
      let errorMessage = `Validation failed with status ${response.status}`;
      try {
        const errorBody = (await response.json()) as { error?: string };
        if (errorBody?.error) {
          errorMessage = errorBody.error;
        }
      } catch (err) {
        console.error('Failed to parse validation error payload', err);
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as ScenarioValidationResult;
  }, [currentProfile, defaultScenarioCount, timeHorizonHours, variables]);

  const exportScenario = useCallback((): ScenarioInputs => {
    return {
      variables,
      duration: timeHorizonHours,
      airport: currentProfile || 'DOH',
      name: `${currentProfile} Exported Scenario`
    };
  }, [variables, currentProfile, timeHorizonHours]);

  const importScenario = useCallback((scenario: ScenarioInputs) => {
    if (scenario.airport !== currentProfile) {
      setProfile(scenario.airport);
    }
    setVariables(applySchemaDefaults(scenario.variables));
    updateTimeHorizon(scenario.duration ?? BASELINE_HORIZON_HOURS);
    setError(null);
  }, [currentProfile, setProfile, updateTimeHorizon, applySchemaDefaults]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    // State
    currentProfile,
    currentAirport: currentProfile, // legacy alias
    profileConfig,
    airportConfig: profileConfig, // legacy alias
    variables,
    timeHorizonHours,
    results,
    isLoading,
    error,
    performance,

    // Actions
    setProfile,
    setAirport: setProfile, // legacy alias
    updateVariables,
    setTimeHorizonHours: updateTimeHorizon,
    resetToDefaults,
    loadPreset,
    executeScenarios,
    validateScenario,
    exportScenario,
    importScenario,
    clearResults
  };
}

type ScenarioPreset = ReturnType<typeof getScenarioPresets>[number];

export function useScenarioPresets(profileId?: string) {
  const tenantConfig = useMemo(() => getTenantConfig(), []);
  const { metrics } = useTenantScenarioMetrics(tenantConfig.key);

  const basePresets = useMemo(() => {
    return profileId ? getScenarioPresets(profileId) : [];
  }, [profileId]);

  return useMemo(
    () => applyTenantScenarioOverrides(basePresets, metrics, tenantConfig.type),
    [basePresets, metrics, tenantConfig.type]
  );
}

export function useScenarioVariables(profileId?: string) {
  const config = useMemo(() => {
    return profileId ? getScenarioProfile(profileId) : null;
  }, [profileId]);

  const controllableVariables = useMemo(() => {
    return getControllableVariables();
  }, []);

  const categorizedVariables = useMemo(() => {
    const categories: Record<string, typeof SCENARIO_VARIABLES> = {};

    for (const variable of controllableVariables) {
      if (!categories[variable.category]) {
        categories[variable.category] = [];
      }
      categories[variable.category].push(variable);
    }

    return categories;
  }, [controllableVariables]);

  return {
    config,
    controllableVariables,
    categorizedVariables: categorizedVariables as Record<string, typeof SCENARIO_VARIABLES>,
    allVariables: SCENARIO_VARIABLES
  };
}

export function useEnginePerformance() {
  const [performanceLog, setPerformanceLog] = useState<Array<{
    timestamp: number;
    profileId: string;
    scenarioCount: number;
    executionTime: number;
    scenariosPerSecond: number;
  }>>([]);

  const logPerformance = useCallback((
    profileId: string,
    scenarioCount: number,
    executionTime: number
  ) => {
    const entry = {
      timestamp: Date.now(),
      profileId,
      scenarioCount,
      executionTime,
      scenariosPerSecond: scenarioCount / (executionTime / 1000)
    };

    setPerformanceLog(prev => [...prev.slice(-49), entry]); // Keep last 50 entries
  }, []);

  const averagePerformance = useMemo(() => {
    if (performanceLog.length === 0) return null;

    const total = performanceLog.reduce((acc, entry) => ({
      executionTime: acc.executionTime + entry.executionTime,
      scenariosPerSecond: acc.scenariosPerSecond + entry.scenariosPerSecond
    }), { executionTime: 0, scenariosPerSecond: 0 });

    return {
      averageExecutionTime: total.executionTime / performanceLog.length,
      averageScenariosPerSecond: total.scenariosPerSecond / performanceLog.length,
      totalExecutions: performanceLog.length
    };
  }, [performanceLog]);

  return {
    performanceLog,
    averagePerformance,
    logPerformance
  };
}

export function applyTenantScenarioOverrides(
  presets: ScenarioPreset[],
  metrics: TenantScenarioMetrics | null,
  tenantType: TenantType
): ScenarioPreset[] {
  if (!metrics) {
    return presets;
  }

  return presets.map((preset) => {
    const nextVariables = { ...preset.variables };

    if (metrics.operations) {
      const {
        estimatedVisitors,
        avgQueueLength,
        avgWaitSeconds,
        securityStaffLevel,
      } = metrics.operations;

      // Map retail visitor metrics to scenario variables (which may use legacy airport terminology)
      if (estimatedVisitors !== undefined) {
        if (nextVariables.passengerArrivals !== undefined) {
          nextVariables.passengerArrivals = Math.max(1, Math.round(estimatedVisitors));
        }
        if (nextVariables.passengerDepartures !== undefined) {
          nextVariables.passengerDepartures = Math.max(1, Math.round(estimatedVisitors * 0.98));
        }
        if (nextVariables.transferPassengers !== undefined && metrics.retail?.avgFootfall !== undefined) {
          nextVariables.transferPassengers = Math.max(0, Math.round(metrics.retail.avgFootfall * 10));
        }
      }

      if (securityStaffLevel !== undefined && nextVariables.securityStaffLevel !== undefined) {
        nextVariables.securityStaffLevel = clamp(Math.round(securityStaffLevel), 60, 150);
      }

      if (avgQueueLength !== undefined && nextVariables.securityLanesOpen !== undefined) {
        nextVariables.securityLanesOpen = clamp(Math.round(avgQueueLength / 2), 2, 40);
      }

      if (avgWaitSeconds !== undefined && nextVariables.securityProcessingRate !== undefined) {
        const processingRate = Math.max(60, Math.round(180 * (120 / Math.max(avgWaitSeconds, 60))));
        nextVariables.securityProcessingRate = processingRate;
      }
    }

    if ((tenantType === 'RETAIL' || tenantType === 'MIXED') && metrics.retail) {
      const { avgSalesAmount, avgTransactions, avgFootfall } = metrics.retail;

      if (avgSalesAmount !== undefined && nextVariables.retailSales !== undefined) {
        nextVariables.retailSales = Math.max(0, Math.round(avgSalesAmount));
      }

      if (avgTransactions !== undefined && nextVariables.transactions !== undefined) {
        nextVariables.transactions = Math.max(0, Math.round(avgTransactions));
      }

      if (avgFootfall !== undefined) {
        if (nextVariables.passengerArrivals !== undefined) {
          nextVariables.passengerArrivals = Math.max(1, Math.round(avgFootfall * 20));
        }
        if (nextVariables.retailFootfall !== undefined) {
          nextVariables.retailFootfall = Math.max(1, Math.round(avgFootfall));
        }
      }
    }

    if (metrics.energy) {
      const { avgConsumptionKwh, avgCost } = metrics.energy;
      if (avgConsumptionKwh !== undefined && nextVariables.energyConsumption !== undefined) {
        nextVariables.energyConsumption = Math.max(1, Math.round(avgConsumptionKwh));
      }
      if (avgCost !== undefined && nextVariables.energyCost !== undefined) {
        nextVariables.energyCost = Math.max(1, Math.round(avgCost));
      }
    }

    if (metrics.security) {
      const { totalEvents, criticalEvents } = metrics.security;
      if (totalEvents !== undefined && nextVariables.securityIncidentActive !== undefined) {
        nextVariables.securityIncidentActive = Math.min(100, Math.max(10, totalEvents * 5));
      }
      if (criticalEvents !== undefined && nextVariables.emergencyResponseReadiness !== undefined) {
        const readiness = 100 - Math.min(60, criticalEvents * 4);
        nextVariables.emergencyResponseReadiness = clamp(readiness, 40, 100);
      }
    }

    return {
      ...preset,
      variables: nextVariables,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
