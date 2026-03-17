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
  realidea: {
    id: 'realidea',
    name: 'Realidea',
    description: 'Finnish multi-property operator',
    country: 'FI',
    brandColors: {
      primary: '#1e40af', // Blue
      secondary: '#3b82f6',
      accent: '#60a5fa',
    },
  },
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
  citycon: {
    id: 'citycon',
    name: 'Citycon',
    description: 'Leading Nordic shopping centre operator',
    country: 'FI',
    website: 'https://www.citycon.com/',
    brandColors: {
      primary: '#00a651', // Citycon green
      secondary: '#00c664',
      accent: '#33d67a',
    },
  },
};

/**
 * All Mall Properties
 * Organized by operator for clarity
 */
export const MALLS: Record<string, MallProperty> = {
  // ============================================================================
  // REALIDEA PROPERTIES (18 malls)
  // ============================================================================
  sello: {
    id: 'sello',
    name: 'Sello',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2176, lon: 24.8092 },
    annualVisitors: 22600000,
    annualSales: 298000000,
    gla: 58000,
  },
  tripla: {
    id: 'tripla',
    name: 'Mall of Tripla',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1992, lon: 24.9318 },
    annualVisitors: 27300000,
    annualSales: 342000000,
    gla: 74000,
  },
  itis: {
    id: 'itis',
    name: 'Itis',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2108, lon: 25.0816 },
    annualVisitors: 18500000,
    annualSales: 245000000,
  },
  jumbo: {
    id: 'jumbo',
    name: 'Jumbo',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2929, lon: 25.0406 },
    annualVisitors: 16200000,
    annualSales: 218000000,
  },
  kamp_galleria: {
    id: 'kamp-galleria',
    name: 'Kämp Galleria',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'planned',
    coordinates: { lat: 60.1674, lon: 24.9450 },
    annualVisitors: 3500000,
    annualSales: 85000000,
  },
  karuselli: {
    id: 'karuselli',
    name: 'Karuselli',
    operator: 'realidea',
    city: 'Kerava',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 60.4040, lon: 25.1050 },
    annualVisitors: 4200000,
    annualSales: 62000000,
  },
  plaza: {
    id: 'plaza',
    name: 'Plaza',
    operator: 'realidea',
    city: 'Salo',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.3833, lon: 23.1261 },
    annualVisitors: 3800000,
    annualSales: 54000000,
  },
  arabia: {
    id: 'arabia',
    name: 'Arabia',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2050, lon: 24.9790 },
    annualVisitors: 6500000,
    annualSales: 92000000,
  },
  columbus: {
    id: 'columbus',
    name: 'Columbus',
    operator: 'realidea',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1834, lon: 24.9340 },
    annualVisitors: 8200000,
    annualSales: 118000000,
  },
  duo: {
    id: 'duo',
    name: 'Duo',
    operator: 'realidea',
    city: 'Tampere',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.4978, lon: 23.7610 },
    annualVisitors: 7600000,
    annualSales: 105000000,
  },
  grani: {
    id: 'grani',
    name: 'Grani',
    operator: 'realidea',
    city: 'Kauniainen',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 60.2124, lon: 24.7272 },
    annualVisitors: 2800000,
    annualSales: 42000000,
  },
  dixi: {
    id: 'dixi',
    name: 'Dixi',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.2935, lon: 25.0343 },
    annualVisitors: 5100000,
    annualSales: 68000000,
  },
  entresse: {
    id: 'entresse',
    name: 'Entresse',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2046, lon: 24.6597 },
    annualVisitors: 11200000,
    annualSales: 148000000,
  },
  fresko: {
    id: 'fresko',
    name: 'Fresko',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2775, lon: 25.0410 },
    annualVisitors: 5800000,
    annualSales: 78000000,
  },
  kale: {
    id: 'kale',
    name: 'Kale',
    operator: 'realidea',
    city: 'Tampere',
    country: 'FI',
    status: 'beta',
    coordinates: { lat: 61.4981, lon: 23.7804 },
    annualVisitors: 3400000,
    annualSales: 48000000,
  },
  kivis: {
    id: 'kivis',
    name: 'Kivis',
    operator: 'realidea',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2862, lon: 25.0390 },
    annualVisitors: 5600000,
    annualSales: 72000000,
  },
  liila: {
    id: 'liila',
    name: 'Liila',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'alpha',
    coordinates: { lat: 60.2197, lon: 24.7442 },
    annualVisitors: 4100000,
    annualSales: 58000000,
  },
  lansikeskus: {
    id: 'lansikeskus',
    name: 'Länsikeskus',
    operator: 'realidea',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2230, lon: 24.8018 },
    annualVisitors: 6900000,
    annualSales: 96000000,
  },

  // ============================================================================
  // KOY IDEAPARK AB (1 mall)
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
    gla: 91000, // One of Finland's largest malls
    stores: 200,
  },

  // ============================================================================
  // CITYCON PROPERTIES
  // Finland (9 malls)
  // ============================================================================
  iso_omena: {
    id: 'iso-omena',
    name: 'Iso Omena',
    operator: 'citycon',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1619, lon: 24.7373 },
    annualVisitors: 9500000,
    annualSales: 187000000,
    gla: 62000,
  },
  lippulaiva: {
    id: 'lippulaiva',
    name: 'Lippulaiva',
    operator: 'citycon',
    city: 'Espoo',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2050, lon: 24.7305 },
    annualVisitors: 6000000,
    gla: 47000,
  },
  myyrmanni: {
    id: 'myyrmanni',
    name: 'Myyrmanni',
    operator: 'citycon',
    city: 'Vantaa',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.2575, lon: 24.8435 },
    annualVisitors: 8500000,
    gla: 47000,
  },
  citycon_columbus: {
    id: 'citycon-columbus',
    name: 'Columbus',
    operator: 'citycon',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1883, lon: 24.9353 },
    annualVisitors: 6800000,
    gla: 19000,
  },
  koskikeskus: {
    id: 'koskikeskus',
    name: 'Koskikeskus',
    operator: 'citycon',
    city: 'Tampere',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.4978, lon: 23.7609 },
    annualVisitors: 7200000,
    gla: 35000,
  },
  trio: {
    id: 'trio',
    name: 'Trio',
    operator: 'citycon',
    city: 'Lahti',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.9827, lon: 25.6612 },
    annualVisitors: 4500000,
    gla: 45000,
  },
  isokarhu: {
    id: 'isokarhu',
    name: 'IsoKarhu',
    operator: 'citycon',
    city: 'Pori',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.4854, lon: 21.7971 },
    annualVisitors: 3200000,
    gla: 28000,
  },
  isokristiina: {
    id: 'isokristiina',
    name: 'IsoKristiina',
    operator: 'citycon',
    city: 'Lappeenranta',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 61.0587, lon: 28.1886 },
    annualVisitors: 3800000,
    gla: 43000,
  },
  citycon_kamppi: {
    id: 'citycon-kamppi',
    name: 'Kamppi',
    operator: 'citycon',
    city: 'Helsinki',
    country: 'FI',
    status: 'live',
    coordinates: { lat: 60.1687, lon: 24.9319 },
    annualVisitors: 12000000,
    gla: 50000,
  },

  // ============================================================================
  // CITYCON SWEDEN (6 malls)
  // ============================================================================
  kista_galleria: {
    id: 'kista-galleria',
    name: 'Kista Galleria',
    operator: 'citycon',
    city: 'Stockholm',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 59.4033, lon: 17.9447 },
    annualVisitors: 9500000,
    gla: 92000,
  },
  liljeholmstorget: {
    id: 'liljeholmstorget',
    name: 'Liljeholmstorget Galleria',
    operator: 'citycon',
    city: 'Stockholm',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 59.3108, lon: 18.0234 },
    annualVisitors: 7800000,
    gla: 42000,
  },
  jakobsbergs: {
    id: 'jakobsbergs',
    name: 'Jakobsbergs Centrum',
    operator: 'citycon',
    city: 'Järfälla',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 59.4217, lon: 17.8352 },
    annualVisitors: 5200000,
    gla: 33000,
  },
  akersberga: {
    id: 'akersberga',
    name: 'Åkersberga Centrum',
    operator: 'citycon',
    city: 'Österåker',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 59.4798, lon: 18.3043 },
    annualVisitors: 4100000,
    gla: 25000,
  },
  molndal: {
    id: 'molndal',
    name: 'Mölndal Galleria',
    operator: 'citycon',
    city: 'Mölndal',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 57.6554, lon: 12.0141 },
    annualVisitors: 6300000,
    gla: 38000,
  },
  stenungstorg: {
    id: 'stenungstorg',
    name: 'Stenungstorg Centrum',
    operator: 'citycon',
    city: 'Stenungsund',
    country: 'SE',
    status: 'live',
    coordinates: { lat: 58.0706, lon: 11.8181 },
    annualVisitors: 3500000,
    gla: 22000,
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
