/**
 * Weather utilities for mall footfall impact calculations
 * Location data is selected by canonical mall id.
 */
import { canonicalizeMallId } from '@/lib/mall/ids';
import { getMall } from '@/lib/mall/mallDatabase';

export interface WeatherData {
  temperature: number;       // °C
  humidity: number;          // %
  windSpeed: number;         // km/h
  condition: string;         // e.g. "Clear", "Rain"
  description: string;       // e.g. "Optimal conditions"
  comfortIndex: number;      // 0–1
  footfallImpact: number;    // % change vs baseline
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  precipitation?: number;    // mm
  icon?: string;
  source?: string;
}

export interface MallCoordinates {
  lat: number;
  lon: number;
  timezone: string;
  fmiPlace?: string;
  label?: string;
}

export const MALL_COORDINATES: Record<string, MallCoordinates> = {
  'ideapark-lempaala': {
    lat: 61.3615,
    lon: 23.7987,
    timezone: 'Europe/Helsinki',
    fmiPlace: 'Lempäälä',
    label: 'Ideapark Lempäälä',
  },
  ideapark: {
    lat: 61.3615,
    lon: 23.7987,
    timezone: 'Europe/Helsinki',
    fmiPlace: 'Lempäälä',
    label: 'Ideapark Lempäälä',
  },
  'realidea-sello': {
    lat: 60.2176,
    lon: 24.8092,
    timezone: 'Europe/Helsinki',
    fmiPlace: 'Espoo',
    label: 'Sello',
  },
  'realidea-tripla': {
    lat: 60.1992,
    lon: 24.9318,
    timezone: 'Europe/Helsinki',
    fmiPlace: 'Helsinki',
    label: 'Mall of Tripla',
  },
};

export function getMallCoordinates(mallId: string): MallCoordinates {
  const canonical = canonicalizeMallId(mallId);
  if (canonical && MALL_COORDINATES[canonical]) return MALL_COORDINATES[canonical];
  if (MALL_COORDINATES[mallId]) return MALL_COORDINATES[mallId];

  const mall = getMall(canonical || mallId);
  if (mall) {
    return {
      lat: mall.coordinates.lat,
      lon: mall.coordinates.lon,
      timezone: 'Europe/Helsinki',
      fmiPlace: mall.city,
      label: mall.name,
    };
  }
  return MALL_COORDINATES['ideapark-lempaala'];
}

/**
 * Determine season from month (Finland-calibrated)
 */
export function getSeason(date: Date = new Date()): WeatherData['season'] {
  const month = date.getMonth(); // 0–11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/**
 * Determine time of day bucket from hour
 */
export function getTimeOfDay(date: Date = new Date()): WeatherData['timeOfDay'] {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate perceived comfort index (0 = uncomfortable, 1 = ideal)
 * Based on temperature, humidity and wind for Finnish climate.
 */
export function calculateComfortIndex(
  temperatureC: number,
  humidity: number,
  windSpeedKmh: number
): number {
  // Ideal indoor-shopping weather: cool outside (5–15°C), low wind, moderate humidity
  const tempScore = temperatureC >= 5 && temperatureC <= 15
    ? 1.0
    : temperatureC > 15 && temperatureC <= 25
    ? 0.8
    : temperatureC > 25
    ? 0.6
    : 0.5; // below 5°C

  const windScore = windSpeedKmh < 10 ? 1.0 : windSpeedKmh < 20 ? 0.85 : 0.7;
  const humidityScore = humidity < 70 ? 1.0 : humidity < 85 ? 0.85 : 0.7;

  return Math.round((tempScore * 0.5 + windScore * 0.3 + humidityScore * 0.2) * 100) / 100;
}

/**
 * Estimate footfall impact (%) from weather conditions.
 * Positive = more visitors, Negative = fewer visitors.
 *
 * Two-segment blended model for destination malls (Ideapark):
 *   ~90% arrive by car  → weather affects "should I go out?" decision (low sensitivity)
 *   ~10% walk/transit    → weather directly affects journey comfort (high sensitivity)
 *
 * totalImpact = (carImpact × 0.90) + (walkImpact × 0.10), clamped to [-15, +15]
 */
export function calculateFootfallImpact(
  condition: string,
  temperatureC: number,
  windSpeedKmh: number,
  precipitationMm: number = 0
): number {
  const cond = condition.toLowerCase();
  const isSnow = cond.includes('snow') || cond.includes('sleet');

  // ── Car segment (90%) — decision-based, low sensitivity ──

  let carImpact = 0;

  // Temperature: cold/unpleasant → prefer indoor mall; nice day → go outside
  if (temperatureC < -20) carImpact += -4;
  else if (temperatureC < -5) carImpact += 1;
  else if (temperatureC < 5) carImpact += 2;
  else if (temperatureC < 15) carImpact += 0;
  else if (temperatureC < 22) carImpact += -2;
  else if (temperatureC < 28) carImpact += 0;
  else carImpact += 1; // > 28°C, heat drives to AC

  // Sky condition
  if (cond.includes('overcast')) carImpact += 1;
  else if (cond.includes('cloudy') && !cond.includes('partly')) carImpact += 0.5;
  else if (cond.includes('clear') || cond.includes('sunny')) carImpact += -1;

  // Precipitation
  if (isSnow && temperatureC < 1) {
    carImpact += -2; // Bad roads
  } else if (precipitationMm > 4) {
    carImpact += 3; // Heavy rain — outdoor plans cancelled
  } else if (precipitationMm > 1) {
    carImpact += 2;
  } else if (precipitationMm > 0.2) {
    carImpact += 1;
  }

  // Extreme wind deters all trips
  if (windSpeedKmh > 30) carImpact += -2;

  // ── Walk/transit segment (10%) — exposure-based, high sensitivity ──

  let walkImpact = 0;

  // Temperature
  if (temperatureC < -20) walkImpact += -40;
  else if (temperatureC < -10) walkImpact += -15;
  else if (temperatureC < 0) walkImpact += -5;
  else if (temperatureC < 5) walkImpact += 5;
  else if (temperatureC < 15) walkImpact += 0;
  else if (temperatureC < 25) walkImpact += -5;
  else walkImpact += 5; // > 25°C, want AC

  // Wind chill — cold + wind makes walking miserable
  if (windSpeedKmh > 25) {
    walkImpact += -15; // Storm-level
  } else if (windSpeedKmh > 15 && temperatureC < 5) {
    walkImpact += -10; // Wind chill
  }

  // Precipitation
  if (isSnow) {
    walkImpact += -15;
  } else if (precipitationMm > 4) {
    walkImpact += -20; // Won't walk in downpour
  } else if (precipitationMm > 1) {
    walkImpact += -10;
  } else if (precipitationMm > 0.2) {
    walkImpact += 10; // Quick dash to shelter in mall
  }

  // Sky
  if (cond.includes('overcast')) walkImpact += 5;
  else if (cond.includes('clear') || cond.includes('sunny')) walkImpact += -5;

  // ── Blend and clamp ──
  const blended = carImpact * 0.9 + walkImpact * 0.1;
  return Math.round(Math.max(-15, Math.min(15, blended)) * 10) / 10;
}
