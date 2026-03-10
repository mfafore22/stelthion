import { useState, useEffect, useCallback } from 'react';
import {
  PRESET_CATEGORIES,
  getPresetById,
  validatePresetSystemIntegrity,
  getPresetCategoriesByMode,
  type PresetCategoryInfo,
  type PresetExecutionConfig,
  type PresetResults
} from '@/lib/whatif/presets';
import { PresetEngineFactory } from '@/lib/whatif/presets/engines/engineFactory';
import type { PlannerMode } from '@/stores/useShellStore';

export interface UsePresetRegistryReturn {
  // Preset data
  presetCategories: PresetCategoryInfo[];
  allCategories: PresetCategoryInfo[];
  availablePresets: number;

  // Execution
  executePreset: (config: PresetExecutionConfig) => Promise<PresetResults>;
  isExecuting: boolean;
  executionError: string | null;

  // Validation
  validatePreset: (presetId: string, airport: string) => boolean;
  getPresetDetails: (presetId: string) => any;

  // System status
  isPresetSystemReady: boolean;
  systemErrors: string[];
}

export function usePresetRegistry(currentAirport?: string, mode?: PlannerMode): UsePresetRegistryReturn {
  const [presetCategories, setPresetCategories] = useState<PresetCategoryInfo[]>([]);
  const [allCategories] = useState<PresetCategoryInfo[]>(PRESET_CATEGORIES);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isPresetSystemReady, setIsPresetSystemReady] = useState(false);
  const [systemErrors, setSystemErrors] = useState<string[]>([]);

  // Initialize preset system and validate integrity
  useEffect(() => {
    const validation = validatePresetSystemIntegrity();

    if (validation.isValid) {
      setIsPresetSystemReady(true);
      setSystemErrors([]);
    } else {
      setIsPresetSystemReady(false);
      setSystemErrors(validation.errors);
      console.warn('Preset system validation failed:', validation.errors);
    }
  }, []);

  // Filter presets by mode and airport
  useEffect(() => {
    // Step 1: Filter by mode first
    let categories = mode ? getPresetCategoriesByMode(mode as any) : PRESET_CATEGORIES;

    // Step 2: Filter by airport if specified
    if (currentAirport) {
      categories = categories.map(category => ({
        ...category,
        presets: category.presets.filter(preset =>
          preset.supportedAirports.includes(currentAirport)
        )
      })).filter(category => category.presets.length > 0);
    }

    setPresetCategories(categories);
  }, [currentAirport, mode]);

  // Execute preset
  const executePreset = useCallback(async (config: PresetExecutionConfig): Promise<PresetResults> => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      const preset = getPresetById(config.presetId);
      if (!preset) {
        throw new Error(`Preset not found: ${config.presetId}`);
      }

      // Validate airport support
      if (!preset.supportedAirports.includes(config.airport)) {
        throw new Error(`Preset ${preset.name} is not supported for airport ${config.airport}`);
      }

      // Create appropriate engine for preset
      const engine = PresetEngineFactory.createEngine(preset);

      // Execute preset
      const results = await engine.executePreset(preset, config);

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown preset execution error';
      setExecutionError(errorMessage);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // Validate if preset can be used with specific airport
  const validatePreset = useCallback((presetId: string, airport: string): boolean => {
    const preset = getPresetById(presetId);
    if (!preset) return false;

    return preset.supportedAirports.includes(airport);
  }, []);

  // Get detailed information about a preset
  const getPresetDetails = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return null;

    return {
      ...preset,
      variableCount: preset.requiredVariables.length,
      airportCount: preset.supportedAirports.length,
      temporalPhases: Object.entries(preset.temporalRelevance)
        .filter(([, relevant]) => relevant)
        .map(([phase]) => phase),
      canBypassScenarioPresets: preset.bypassesScenarioPresets
    };
  }, []);

  // Calculate available presets count
  const availablePresets = presetCategories.reduce(
    (total, category) => total + category.presets.length,
    0
  );

  return {
    // Preset data
    presetCategories,
    allCategories,
    availablePresets,

    // Execution
    executePreset,
    isExecuting,
    executionError,

    // Validation
    validatePreset,
    getPresetDetails,

    // System status
    isPresetSystemReady,
    systemErrors
  };
}

// Helper hook to get presets for a specific category
export function usePresetCategory(category: string, airport?: string) {
  const { presetCategories } = usePresetRegistry(airport);

  const categoryData = presetCategories.find(cat =>
    cat.category === category || cat.name === category
  );

  return {
    category: categoryData || null,
    presets: categoryData?.presets || [],
    isAvailable: !!categoryData,
    presetCount: categoryData?.presets.length || 0
  };
}

// Helper hook to check if a preset is available for current context
export function usePresetAvailability(presetId: string, airport: string) {
  const { validatePreset, getPresetDetails, isPresetSystemReady } = usePresetRegistry();

  const [isAvailable, setIsAvailable] = useState(false);
  const [presetDetails, setPresetDetails] = useState(null);

  useEffect(() => {
    if (isPresetSystemReady && presetId && airport) {
      const available = validatePreset(presetId, airport);
      const details = getPresetDetails(presetId);

      setIsAvailable(available);
      setPresetDetails(details);
    }
  }, [presetId, airport, isPresetSystemReady, validatePreset, getPresetDetails]);

  return {
    isAvailable,
    presetDetails,
    isLoading: !isPresetSystemReady
  };
}
