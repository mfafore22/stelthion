/**
 * @deprecated Use useScenarioEngine instead.
 *
 * Temporary shim that re-exports the new property-agnostic scenario engine
 * hooks to maintain backward compatibility while we finish migrating
 * imports across the codebase.
 */
export {
  useScenarioEngine as useAirportEngine,
  formatEngineErrorMessage,
  useScenarioPresets as useAirportPresets,
  useScenarioVariables as useAirportVariables,
  useEnginePerformance,
  applyTenantScenarioOverrides,
} from './useScenarioEngine';

export type {
  UseScenarioEngineOptions as UseAirportEngineOptions,
  ScenarioEngineState as AirportEngineState,
  ScenarioValidationTotals,
  ScenarioValidationMeta,
  ScenarioValidationResult,
  ScenarioValidationOptions,
  ValidationEngineResult,
  ValidationDryRunSummary,
  ValidationConsistencyType,
  ValidationConsistencyIssue,
  ValidationConsistencyReport,
  ScenarioValidationDiagnostics,
  ScenarioEngineActions as AirportEngineActions,
} from './useScenarioEngine';
