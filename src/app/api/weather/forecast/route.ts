import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSeason, getMallCoordinates } from '@/lib/weather/utils'
import { fetchFmiForecast, classifyForecastCondition, type FmiForecastPoint } from '@/lib/weather/fmi'

function aggregateDay(date: string, points: FmiForecastPoint[]) {
  const temps = points.map((p) => p.temperature)
  const avgTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
  const avgHumidity = Math.round(points.reduce((a, p) => a + p.humidity, 0) / points.length)
  const avgWind = Math.round((points.reduce((a, p) => a + p.windSpeedKmh, 0) / points.length) * 10) / 10
  const totalPrecip = Math.round(points.reduce((a, p) => a + p.precipitation1h, 0) * 10) / 10
  const classified = classifyForecastCondition(totalPrecip / points.length, avgTemp)
  return {
    date, temperature: avgTemp, humidity: avgHumidity, windSpeed: avgWind,
    condition: classified.condition, description: classified.description,
    precipitation: totalPrecip, icon: classified.icon, season: getSeason(new Date(date)),
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mallId = searchParams.get('mallId') || 'ideapark'
  const coords = getMallCoordinates(mallId)
  const now = new Date()
  const season = getSeason(now)

  const fmiPoints = await fetchFmiForecast(coords.lat, coords.lon, 120, coords.fmiPlace)

  let forecast: Array<{
    date: string; temperature: number; humidity: number; windSpeed: number;
    condition: string; description: string; precipitation: number; icon: string; season: string;
  }>
  let source: string
  let live: boolean

  if (fmiPoints.length > 0) {
    const byDate = new Map<string, FmiForecastPoint[]>()
    for (const pt of fmiPoints) {
      const dateKey = pt.time.split('T')[0]
      if (!byDate.has(dateKey)) byDate.set(dateKey, [])
      byDate.get(dateKey)!.push(pt)
    }
    const todayStr = now.toISOString().split('T')[0]
    forecast = [...byDate.entries()]
      .filter(([d]) => d > todayStr)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5)
      .map(([date, points]) => aggregateDay(date, points))
    source = `FMI Open Data HARMONIE — ${coords.fmiPlace || mallId} (${coords.lat}°N, ${coords.lon}°E)`
    live = true
  } else {
    const SEASON_TEMP: Record<string, number> = { spring: 8, summer: 20, autumn: 6, winter: -4 }
    const CONDITIONS = [
      { condition: 'Clear', description: 'Clear sky', icon: '01d' },
      { condition: 'Cloudy', description: 'Mostly cloudy', icon: '04d' },
      { condition: 'Rain', description: 'Light rain', icon: '10d' },
      { condition: 'Snow', description: 'Light snow', icon: '13d' },
    ]
    const baseTemp = SEASON_TEMP[season]
    const winterConditions = ['Clear', 'Cloudy', 'Snow']
    const otherConditions = ['Clear', 'Clear', 'Cloudy', 'Rain']
    forecast = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() + i + 1)
      const tempVar = Math.round((Math.random() * 6 - 3) * 10) / 10
      const condPool = season === 'winter' ? winterConditions : otherConditions
      const condName = condPool[Math.floor(Math.random() * condPool.length)]
      const cond = CONDITIONS.find((c) => c.condition === condName) || CONDITIONS[0]
      return {
        date: date.toISOString().split('T')[0],
        temperature: baseTemp + tempVar,
        humidity: 65 + Math.floor(Math.random() * 20),
        windSpeed: 4 + Math.floor(Math.random() * 6),
        condition: cond.condition, description: cond.description,
        precipitation: cond.condition === 'Rain' ? 1.5 : cond.condition === 'Snow' ? 1.0 : 0,
        icon: cond.icon, season,
      }
    })
    source = `Stelthion Simulation — ${mallId} (${coords.lat}°N, ${coords.lon}°E)`
    live = false
  }

  return NextResponse.json(
    { mallId, forecast, source, live },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  )
}
