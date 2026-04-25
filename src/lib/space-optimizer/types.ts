export type SpaceSuggestionAction = 'EXPAND' | 'CONVERT' | 'MAINTAIN' | 'SUNSET';

export type RationaleByLang = {
  en: string;
  fi: string;
  sv: string;
};

export interface DrivingTrendRef {
  id: string;
  label: string;
  state: 'EMERGING' | 'ACCELERATING' | 'STABLE' | 'FADING' | 'DORMANT';
  velocity: number;
}

export interface SpaceSuggestion {
  id: string;
  zoneId: string;
  zoneFloor: string;
  zoneName: string;
  currentCategory: string;
  action: SpaceSuggestionAction;
  proposedCategory?: string;
  drivingTrendIds: string[];
  rationale: RationaleByLang;
  confidence: number;
  projectedUpliftPct?: number;
  projectedAnnualEur?: number;
  leaseEndsOn?: string | null;
  tenantName?: string | null;
  monthlyRentEur?: number | null;
  areaSqm?: number;
  baseVisitors?: number;
  svgPoints?: string;
}

export interface SpaceSuggestionsResponse {
  mallId: string;
  mallName: string;
  generatedAt: string;
  drivingTrends: DrivingTrendRef[];
  suggestions: SpaceSuggestion[];
}
