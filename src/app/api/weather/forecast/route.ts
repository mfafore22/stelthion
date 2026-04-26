/**
 * Weather 5-day forecast API
 * Returns simulated forecast for Ideapark Lempäälä.
 */

import { NextResponse } from 'next/server';
import { getSeason } from '@/lib/weather/utils';

const SEASON_TEMP: Record<string, number> = {
  spring: 8,
  summer: 20,
  autumn: 6,
  winter: -4,
};

const CONDITIONS = [
  { condition: 'Clear', description: 'Clear sky', icon: '01d' },
  { condition: 'Cloudy', description: 'Mostly cloudy', icon: '04d' },
  { condition: 'Rain', description: 'Light rain', icon: '10d' },
  { condition: 'Snow', description: 'Light snow', icon: '13d' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mallId = searchParams.get('mallId') || 'ideapark-lempaala';

  const now = new Date();
  const season = getSeason(now);
  const baseTemp = SEASON_TEMP[season];

  const winterConditions = ['Clear', 'Cloudy', 'Snow'];
  const otherConditions = ['Clear', 'Clear', 'Cloudy', 'Rain'];

  const forecast = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() + i + 1);

    const tempVar = Math.round((Math.random() * 6 - 3) * 10) / 10;
    const temperature = baseTemp + tempVar;

    const condPool = season === 'winter' ? winterConditions : otherConditions;
    const condName = condPool[Math.floor(Math.random() * condPool.length)];
    const cond = CONDITIONS.find(c => c.condition === condName) || CONDITIONS[0];

    return {
      date: date.toISOString().split('T')[0],
      temperature,
      humidity: 65 + Math.floor(Math.random() * 20),
      windSpeed: 4 + Math.floor(Math.random() * 6),
      condition: cond.condition,
      description: cond.description,
      precipitation: cond.condition === 'Rain' ? 1.5 : cond.condition === 'Snow' ? 1.0 : 0,
      icon: cond.icon,
      season,
    };
  });

  return NextResponse.json(
    { mallId, forecast, source: 'Stelthion — Ideapark Lempäälä (61.316°N, 23.757°E)' },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
