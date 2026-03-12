'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UnifiedScenario, ScenarioResults, ExecutionStatus, ScenarioType, ScenarioPreset, SystemStatus } from '@/types/unified-scenario.types';
import { scenarioApi, getErrorMessage } from '@/lib/api-client';

export interface UseUnifiedScenarioOptions {
  /** Auto-poll for background execution updates */
  enablePolling?: boolean;
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface UnifiedScenarioState {
  /** Current scenario being executed */
  currentScenario: UnifiedScenario | null;
  /** Execution results */
  results: ScenarioResults | null;
  /** Execution status for background runs */
  executionStatus: ExecutionStatus | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Execution history */
  executionHistory: ScenarioResults[];
}

export interface UnifiedScenarioActions {
  /** Execute a scenario immediately */
  executeScenario: (scenario: UnifiedScenario, background?: boolean) => Promise<ScenarioResults | { executionId: string }>;
  /** Execute multiple scenarios in batch */
  executeBatch: (scenarios: UnifiedScenario[], options?: { parallel?: boolean; comparison?: boolean }) => Promise<ScenarioResults[]>;
  /** Get execution status by ID */
  getExecutionStatus: (executionId: string) => Promise<ExecutionStatus | null>;
  /** Cancel a background execution */
  cancelExecution: (executionId: string) => Promise<boolean>;
  /** Clear results and state */
  clearResults: () => void;
  /** Reset error state */
  clearError: () => void;
}

export function useUnifiedScenarios(options: UseUnifiedScenarioOptions = {}): UnifiedScenarioState & UnifiedScenarioActions {
  const {
    enablePolling = true,
    pollingInterval = 2000,
    timeout = 30000
  } = options;

  // State management
  const [currentScenario, setCurrentScenario] = useState<UnifiedScenario | null>(null);
  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ScenarioResults[]>([]);

  // Polling management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentExecutionIdRef = useRef<string | null>(null);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start polling for execution status
  const startPolling = useCallback((executionId: string) => {
    if (!enablePolling) return;

    currentExecutionIdRef.current = executionId;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await getExecutionStatus(executionId);
        if (status) {
          setExecutionStatus(status);

          // Stop polling if execution is complete
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Set results if completed successfully
            if (status.status === 'completed' && status.results) {
              const completedResult: ScenarioResults = status.results;
              setResults(completedResult);
              setExecutionHistory(prev => [completedResult, ...prev].slice(0, 10)); // Keep last 10
            }

            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on errors unless execution is no longer current
        if (currentExecutionIdRef.current !== executionId) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    }, pollingInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- getExecutionStatus defined below, stable reference
  }, [enablePolling, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    currentExecutionIdRef.current = null;
  }, []);

  // Execute a scenario
  const executeScenario = useCallback(async (
    scenario: UnifiedScenario,
    background = false
  ): Promise<ScenarioResults | { executionId: string }> => {
    setIsLoading(true);
    setError(null);
    setCurrentScenario(scenario);

    try {
      const result = await scenarioApi.executeScenario(scenario, { background, timeout });

      if (result.success) {
        if (result.results) {
          // Immediate execution
          const immediateResult: ScenarioResults = result.results;
          setResults(immediateResult);
          setExecutionHistory(prev => [immediateResult, ...prev].slice(0, 10));
          setIsLoading(false);
          return immediateResult;
        } else {
          // Background execution
          const executionResponse = {
            executionId: result.executionId,
            queuePosition: result.queuePosition,
            estimatedCompletion: result.estimatedCompletion
          };

          setExecutionStatus({
            executionId: result.executionId,
            status: 'queued',
            progress: 0,
            queuePosition: result.queuePosition,
            estimatedCompletion: result.estimatedCompletion
          });

          // Start polling for status updates
          startPolling(result.executionId);

          return executionResponse;
        }
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [timeout, startPolling]);

  // Execute batch scenarios
  const executeBatch = useCallback(async (
    scenarios: UnifiedScenario[],
    options: { parallel?: boolean; comparison?: boolean } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await scenarioApi.executeBatch(scenarios, { ...options, timeout });

      if (result.success) {
        // Store results from successful scenarios
        const successfulResults = result.results.filter(r => r.success);

        if (successfulResults.length > 0) {
          setResults(successfulResults[0]); // Set first result as primary
          setExecutionHistory(prev => [...successfulResults, ...prev].slice(0, 10));
        }

        setIsLoading(false);
        return successfulResults;
      } else {
        throw new Error(result.error || 'Batch execution failed');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [timeout]);

  // Get execution status
  const getExecutionStatus = useCallback(async (executionId: string): Promise<ExecutionStatus | null> => {
    try {
      const result = await scenarioApi.getExecutionStatus(executionId);
      return result.success ? result.status : null;
    } catch (err) {
      console.error('Get execution status error:', err);
      return null;
    }
  }, []);

  // Cancel execution
  const cancelExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      const result = await scenarioApi.cancelExecution(executionId);
      if (result.success) {
        stopPolling();
        setIsLoading(false);
        setExecutionStatus(prev => prev ? { ...prev, status: 'cancelled' } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Cancel execution error:', err);
      return false;
    }
  }, [stopPolling]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults(null);
    setExecutionStatus(null);
    setCurrentScenario(null);
    setExecutionHistory([]);
    stopPolling();
  }, [stopPolling]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    currentScenario,
    results,
    executionStatus,
    isLoading,
    error,
    executionHistory,

    // Actions
    executeScenario,
    executeBatch,
    getExecutionStatus,
    cancelExecution,
    clearResults,
    clearError
  };
}

export function useScenarioPresets(type?: ScenarioType) {
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const result = await scenarioApi.getPresets(type);
        if (result.success) {
          const presetsList = result.presets ?? [];
          setPresets(presetsList);
          setError(null);
        } else {
          setPresets([]);
          setError(result.error || 'Failed to load presets');
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setPresets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, [type]);

  const createPreset = useCallback(async (preset: Omit<ScenarioPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await scenarioApi.createPreset(preset);
      if (result.success && result.preset) {
        const createdPreset: ScenarioPreset = result.preset;
        setPresets(prev => [createdPreset, ...prev]);
        return createdPreset;
      } else {
        throw new Error(result.error || 'Failed to create preset');
      }
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  return {
    presets,
    loading,
    error,
    createPreset
  };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (detailed = false) => {
    try {
      setLoading(true);
      const result = await scenarioApi.getSystemStatus(detailed);
      if (result.success) {
        const { success: _ignored, ...payload } = result;
        setStatus(payload);
        setError(null);
      } else {
        setStatus(null);
        setError('Failed to fetch system status');
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  };
}
