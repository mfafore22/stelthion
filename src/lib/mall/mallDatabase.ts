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
  realidea: {
    id: 'realidea',
    name: 'Realidea Oy',
    description: 'Finnish multi-property mall operator',
    country: 'FI',
    brandColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
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

  'realidea-sello': {
    id: 'realidea-sello',
    name: 'Sello',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2176, lon: 24.8092 },
    annualVisitors: 22600000,
    annualSales: 298000000,
    gla: 58000,
    brandColors: { primary: '#67a93b', secondary: '#2f6f34', accent: '#19311d' },
  },
  'realidea-tripla': {
    id: 'realidea-tripla',
    name: 'Mall of Tripla',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1992, lon: 24.9318 },
    annualVisitors: 27300000,
    annualSales: 342000000,
    gla: 74000,
    brandColors: { primary: '#db4c64', secondary: '#f0c24c', accent: '#2fa866' },
  },
  'realidea-itis': {
    id: 'realidea-itis',
    name: 'Itis',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2108, lon: 25.0816 },
    annualVisitors: 18500000,
    annualSales: 245000000,
    brandColors: { primary: '#f25f5c', secondary: '#2563eb', accent: '#f3c969' },
  },
  'realidea-jumbo': {
    id: 'realidea-jumbo',
    name: 'Jumbo',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2929, lon: 25.0406 },
    annualVisitors: 16200000,
    annualSales: 218000000,
    brandColors: { primary: '#53a548', secondary: '#234d95', accent: '#f2c24d' },
  },
  'realidea-kamp-galleria': {
    id: 'realidea-kamp-galleria',
    name: 'Kämp Galleria',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'planned',
    coordinates: { lat: 60.1674, lon: 24.945 },
    annualVisitors: 3500000,
    annualSales: 85000000,
    brandColors: { primary: '#566542', secondary: '#8f9a77', accent: '#2c3622' },
  },
  'realidea-karuselli': {
    id: 'realidea-karuselli',
    name: 'Karuselli',
    operator: 'realidea',
    city: 'Kerava',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 60.404, lon: 25.105 },
    annualVisitors: 4200000,
    annualSales: 62000000,
    brandColors: { primary: '#08a5b5', secondary: '#0d6d77', accent: '#f1c550' },
  },
  'realidea-plaza': {
    id: 'realidea-plaza',
    name: 'Plaza',
    operator: 'realidea',
    city: 'Salo',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.3833, lon: 23.1261 },
    annualVisitors: 3800000,
    annualSales: 54000000,
    brandColors: { primary: '#2463b8', secondary: '#5e91d6', accent: '#f1bf62' },
  },
  'realidea-arabia': {
    id: 'realidea-arabia',
    name: 'Arabia',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.205, lon: 24.979 },
    annualVisitors: 6500000,
    annualSales: 92000000,
    brandColors: { primary: '#8a4c3a', secondary: '#d2ad82', accent: '#2f241f' },
  },
  'realidea-columbus': {
    id: 'realidea-columbus',
    name: 'Columbus',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1834, lon: 24.934 },
    annualVisitors: 8200000,
    annualSales: 118000000,
    brandColors: { primary: '#0d6ab3', secondary: '#5aa8e0', accent: '#f0b94f' },
  },
  'realidea-duo': {
    id: 'realidea-duo',
    name: 'Duo',
    operator: 'realidea',
    city: 'Tampere',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.4978, lon: 23.761 },
    annualVisitors: 7600000,
    annualSales: 105000000,
    brandColors: { primary: '#7b36bf', secondary: '#b486df', accent: '#1d3557' },
  },
  'realidea-grani': {
    id: 'realidea-grani',
    name: 'Grani',
    operator: 'realidea',
    city: 'Kauniainen',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 60.2124, lon: 24.7272 },
    annualVisitors: 2800000,
    annualSales: 42000000,
    brandColors: { primary: '#2f7d5d', secondary: '#97c6b2', accent: '#18372a' },
  },
  'realidea-dixi': {
    id: 'realidea-dixi',
    name: 'Dixi',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.2935, lon: 25.0343 },
    annualVisitors: 5100000,
    annualSales: 68000000,
    brandColors: { primary: '#ef5a29', secondary: '#f7a463', accent: '#28323f' },
  },
  'realidea-entresse': {
    id: 'realidea-entresse',
    name: 'Entresse',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2046, lon: 24.6597 },
    annualVisitors: 11200000,
    annualSales: 148000000,
    brandColors: { primary: '#f27023', secondary: '#f6c04e', accent: '#7a2f0e' },
  },
  'realidea-fresko': {
    id: 'realidea-fresko',
    name: 'Fresko',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2775, lon: 25.041 },
    annualVisitors: 5800000,
    annualSales: 78000000,
    brandColors: { primary: '#4ea84c', secondary: '#b4d67c', accent: '#1c4a31' },
  },
  'realidea-kale': {
    id: 'realidea-kale',
    name: 'Kale',
    operator: 'realidea',
    city: 'Tampere',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 61.4981, lon: 23.7804 },
    annualVisitors: 3400000,
    annualSales: 48000000,
    brandColors: { primary: '#efc230', secondary: '#ef8e0c', accent: '#4b3d10' },
  },
  'realidea-kivis': {
    id: 'realidea-kivis',
    name: 'Kivis',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2862, lon: 25.039 },
    annualVisitors: 5600000,
    annualSales: 72000000,
    brandColors: { primary: '#f57a21', secondary: '#efb15f', accent: '#4c2e10' },
  },
  'realidea-liila': {
    id: 'realidea-liila',
    name: 'Liila',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.2197, lon: 24.7442 },
    annualVisitors: 4100000,
    annualSales: 58000000,
    brandColors: { primary: '#7f4acb', secondary: '#c49eff', accent: '#302145' },
  },
  'realidea-lansikeskus': {
    id: 'realidea-lansikeskus',
    name: 'Länsikeskus',
    operator: 'realidea',
    city: 'Turku',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.4859, lon: 22.2398 },
    annualVisitors: 6900000,
    annualSales: 96000000,
    brandColors: { primary: '#1f70b7', secondary: '#53b1e5', accent: '#0f334e' },
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

const LEGACY_ID_ALIASES: Record<string, string> = {
  ideapark: 'ideapark-lempaala',
  sello: 'realidea-sello',
  tripla: 'realidea-tripla',
  itis: 'realidea-itis',
  jumbo: 'realidea-jumbo',
  'kamp-galleria': 'realidea-kamp-galleria',
  karuselli: 'realidea-karuselli',
  plaza: 'realidea-plaza',
  arabia: 'realidea-arabia',
  columbus: 'realidea-columbus',
  duo: 'realidea-duo',
  grani: 'realidea-grani',
  dixi: 'realidea-dixi',
  entresse: 'realidea-entresse',
  fresko: 'realidea-fresko',
  kale: 'realidea-kale',
  kivis: 'realidea-kivis',
  liila: 'realidea-liila',
  lansikeskus: 'realidea-lansikeskus',
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
