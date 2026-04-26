/**
 * Comprehensive Mall Database
 * Central source of truth for all mall properties, operators, and metadata
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
  operator: string;
  city: string;
  country: 'FI' | 'SE' | 'NO' | 'EE';
  status: 'live' | 'beta' | 'alpha' | 'planned';
  coordinates: {
    lat: number;
    lon: number;
  };
  annualVisitors?: number;
  annualSales?: number;
  gla?: number;
  stores?: number;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const OPERATORS: Record<string, MallOperator> = {
  koy_ideapark: {
    id: 'koy_ideapark',
    name: 'Koy Ideapark Ab',
    description: 'Owner and operator of Ideapark Lempäälä',
    country: 'FI',
    website: 'https://lempaala.ideapark.fi/',
    brandColors: {
      primary: '#328d2e',
      secondary: '#7cb928',
      accent: '#214990',
    },
  },
};

export const MALLS: Record<string, MallProperty> = {
  'ideapark-lempaala': {
    id: 'ideapark-lempaala',
    name: 'Ideapark Lempäälä',
    operator: 'koy_ideapark',
    city: 'Lempäälä',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.3615, lon: 23.7987 },
    annualVisitors: 7500000,
    annualSales: 450000000,
    gla: 91000,
    stores: 163,
  },
};

export function getMallsByOperator(operatorId: string): MallProperty[] {
  return Object.values(MALLS).filter((mall) => mall.operator === operatorId);
}

export function getMallBrandColors(mallId: string): { primary: string; secondary: string; accent: string } {
  const mall = getMall(mallId);
  if (!mall) {
    return { primary: '#64748b', secondary: '#94a3b8', accent: '#cbd5e1' };
  }

  if (mall.brandColors) {
    return mall.brandColors;
  }

  const operator = OPERATORS[mall.operator];
  return operator?.brandColors || { primary: '#64748b', secondary: '#94a3b8', accent: '#cbd5e1' };
}

export function getOperator(operatorId: string): MallOperator | undefined {
  return OPERATORS[operatorId];
}

// Legacy id aliases — kept here (instead of importing from ./ids) to avoid a
// circular import. Mirror src/lib/mall/ids.ts:LEGACY_ALIASES.
const LEGACY_ID_ALIASES: Record<string, string> = {
  ideapark: 'ideapark-lempaala',
};

export function getMall(mallId: string): MallProperty | undefined {
  if (!mallId) return undefined;
  const exact = MALLS[mallId];
  if (exact) return exact;
  const aliased = LEGACY_ID_ALIASES[mallId];
  return aliased ? MALLS[aliased] : undefined;
}

export function getMallsByCountry(countryCode: 'FI' | 'SE' | 'NO' | 'EE'): MallProperty[] {
  return Object.values(MALLS).filter((mall) => mall.country === countryCode);
}

export function getMallCoordinatesForWeather(mallId: string): { lat: number; lon: number; city: string } {
  const mall = getMall(mallId);
  if (!mall) {
    return { lat: 61.3615, lon: 23.7987, city: 'Lempäälä' };
  }
  return {
    lat: mall.coordinates.lat,
    lon: mall.coordinates.lon,
    city: mall.city,
  };
}