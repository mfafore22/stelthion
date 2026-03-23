/**
 * Weather utilities for mall footfall impact calculations
 * Location data is Ideapark Lempäälä specific.
 */

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
}

/** Ideapark Lempäälä coordinates */
export const MALL_COORDINATES: Record<string, MallCoordinates> = {
  ideapark: {
    lat: 61.316,
    lon: 23.757,
    timezone: 'Europe/Helsinki',
  },
};

export function getMallCoordinates(mallId: string): MallCoordinates {
  return MALL_COORDINATES[mallId] ?? MALL_COORDINATES.ideapark;
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
 * Positive = more visitors (bad weather drives indoor shopping).
 * Negative = fewer visitors (extreme conditions keep people home).
 */
export function calculateFootfallImpact(
  condition: string,
  temperatureC: number,
  windSpeedKmh: number
): number {
  const cond = condition.toLowerCase();

  // Heavy rain/storm → strong indoor draw
  if (cond.includes('thunderstorm') || cond.includes('heavy rain')) return 14;
  // Light rain → moderate indoor draw
  if (cond.includes('rain') || cond.includes('drizzle')) return 8;
  // Snow → people prefer to stay home
  if (cond.includes('snow') || cond.includes('blizzard')) return -10;
  // Extreme cold (<-15°C) → stay home
  if (temperatureC < -15) return -12;
  // Very hot (>28°C) → indoor draw
  if (temperatureC > 28) return 6;
  // High wind → stay home
  if (windSpeedKmh > 40) return -8;
  // Clear/mild → outdoor preference, slight negative
  if (cond.includes('clear') || cond.includes('sunny')) return -3;

  return 0; // neutral
}
