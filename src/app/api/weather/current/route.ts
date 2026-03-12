/**
 * Weather current conditions API
 * Returns season- and time-aware simulated weather for Ideapark Lempäälä.
 * Replace with FMI Open Data integration when available.
 */

import { NextResponse } from 'next/server';
import {
  getSeason,
  getTimeOfDay,
  calculateComfortIndex,
  calculateFootfallImpact,
} from '@/lib/weather/utils';

// Ideapark Lempäälä coordinates
const LAT = 61.316;
const LON = 23.757;

// Seasonal temperature baselines for Lempäälä (°C)
const SEASON_TEMP: Record<string, number> = {
  spring: 8,
  summer: 20,
  autumn: 6,
  winter: -4,
};

const SEASON_CONDITIONS: Record<string, { condition: string; description: string; icon: string }> = {
  spring: { condition: 'Cloudy', description: 'Mostly cloudy', icon: '04d' },
  summer: { condition: 'Clear', description: 'Clear sky', icon: '01d' },
  autumn: { condition: 'Rain', description: 'Light rain', icon: '10d' },
  winter: { condition: 'Snow', description: 'Light snow', icon: '13d' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mallId = searchParams.get('mallId') || 'ideapark';

  const now = new Date();
  const season = getSeason(now);
  const timeOfDay = getTimeOfDay(now);
  const hour = now.getHours();

  // Diurnal temperature variation
  const diurnalDelta = hour >= 6 && hour <= 15 ? 3 : hour >= 16 && hour <= 20 ? 1 : -2;
  const temperature = Math.round((SEASON_TEMP[season] + diurnalDelta) * 10) / 10;

  const { condition, description, icon } = SEASON_CONDITIONS[season];

  // Humidity varies by season
  const humidityBase: Record<string, number> = { spring: 72, summer: 58, autumn: 80, winter: 75 };
  const humidity = humidityBase[season] + Math.floor(Math.random() * 6) - 3;

  // Wind speed varies
  const windSpeedBase: Record<string, number> = { spring: 6, summer: 4, autumn: 8, winter: 5 };
  const windSpeed = windSpeedBase[season] + Math.floor(Math.random() * 4) - 2;

  const precipitation = condition === 'Rain' ? 1.2 : condition === 'Snow' ? 0.8 : 0;

  const weatherData = {
    temperature,
    humidity,
    windSpeed,
    condition,
    description,
    precipitation,
    comfortIndex: calculateComfortIndex(temperature, humidity, windSpeed),
    footfallImpact: calculateFootfallImpact(condition, temperature, windSpeed),
    season,
    timeOfDay,
    icon,
    source: 'Stelthion — Ideapark Lempäälä (61.316°N, 23.757°E)',
    lat: LAT,
    lon: LON,
    mallId,
    timestamp: now.toISOString(),
  };

  return NextResponse.json(weatherData, {
    headers: { 'Cache-Control': 'public, max-age=600' },
  });
}
