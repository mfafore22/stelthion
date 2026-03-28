/**
 * Comprehensive Mall Database
 * Central source of truth for all mall properties, operators, and metadata
 *
 * This file contains:
 * - Mall coordinates for weather API and maps
 * - Operator/ownership information
 * - Brand identities and colors
 * - Property details and statistics
 */

export interface MallOperator {
  id: string;
  name: string;
  description: string;
  country: string;
  website?: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface MallProperty {
  id: string;
  name: string;
  operator: string; // operator ID
  city: string;
  country: 'FI' | 'SE' | 'NO' | 'EE'; // Finland, Sweden, Norway, Estonia
  status: 'live' | 'beta' | 'alpha' | 'planned';
  coordinates: {
    lat: number;
    lon: number;
  };
  // Statistics
  annualVisitors?: number;
  annualSales?: number; // EUR
  gla?: number; // Gross leasable area in sqm
  stores?: number;
  // Brand colors (mall-specific, overrides operator if set)
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Mall Operators
 */
export const OPERATORS: Record<string, MallOperator> = {
  koy_ideapark: {
    id: 'koy_ideapark',
    name: 'Koy Ideapark Ab',
    description: 'Owner and operator of Ideapark Lempäälä',
    country: 'FI',
    website: 'https://lempaala.ideapark.fi/',
    brandColors: {
      primary: '#d60042', // Ideapark red
      secondary: '#ff1744',
      accent: '#ff5177',
    },
  },
};

/**
 * All Mall Properties
 * Organized by operator for clarity
 */
export const MALLS: Record<string, MallProperty> = {
  // ============================================================================
  // KOY IDEAPARK AB
  // ============================================================================
  ideapark: {
    id: 'ideapark',
    name: 'Ideapark Lempäälä',
    operator: 'koy_ideapark',
    city: 'Lempäälä',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.3615, lon: 23.7987 },
    annualVisitors: 7500000,
    annualSales: 450000000,
    gla: 91000,
    stores: 200,
  },
};

/**
 * Helper functions
 */

/**
 * Get all malls for a specific operator
 */
export function getMallsByOperator(operatorId: string): MallProperty[] {
  return Object.values(MALLS).filter((mall) => mall.operator === operatorId);
}

/**
 * Get mall brand colors (mall-specific or operator default)
 */
export function getMallBrandColors(mallId: string): { primary: string; secondary: string; accent: string } {
  const mall = MALLS[mallId];
  if (!mall) {
    return { primary: '#64748b', secondary: '#94a3b8', accent: '#cbd5e1' }; // Default gray
  }

  if (mall.brandColors) {
    return mall.brandColors;
  }

  const operator = OPERATORS[mall.operator];
  return operator?.brandColors || { primary: '#64748b', secondary: '#94a3b8', accent: '#cbd5e1' };
}

/**
 * Get operator info
 */
export function getOperator(operatorId: string): MallOperator | undefined {
  return OPERATORS[operatorId];
}

/**
 * Get mall property
 */
export function getMall(mallId: string): MallProperty | undefined {
  return MALLS[mallId];
}

/**
 * Get all malls in a country
 */
export function getMallsByCountry(countryCode: 'FI' | 'SE' | 'NO' | 'EE'): MallProperty[] {
  return Object.values(MALLS).filter((mall) => mall.country === countryCode);
}

/**
 * Get coordinates for weather API
 */
export function getMallCoordinatesForWeather(mallId: string): { lat: number; lon: number; city: string } {
  const mall = MALLS[mallId];
  if (!mall) {
    return { lat: 60.1699, lon: 24.9384, city: 'Helsinki' }; // Default
  }
  return {
    lat: mall.coordinates.lat,
    lon: mall.coordinates.lon,
    city: mall.city,
  };
}
