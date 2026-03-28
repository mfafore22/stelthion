import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getSeason,
  getTimeOfDay,
  calculateComfortIndex,
  calculateFootfallImpact,
  getMallCoordinates,
} from '@/lib/weather/utils'
import { fetchFmiObservation, classifyCondition } from '@/lib/weather/fmi'

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
  const timeOfDay = getTimeOfDay(now)

  const obs = await fetchFmiObservation(coords.lat, coords.lon, coords.fmiPlace)

  let temperature: number
  let humidity: number
  let windSpeed: number
  let precipitation: number
  let condition: string
  let description: string
  let icon: string
  let source: string

  if (obs) {
    temperature = obs.temperature
    humidity = obs.humidity
    windSpeed = obs.windSpeedKmh
    precipitation = obs.precipitation1h
    const classified = classifyCondition(obs.cloudiness, obs.precipitation1h, obs.temperature)
    condition = classified.condition
    description = classified.description
    icon = classified.icon
    source = `FMI Open Data — ${coords.fmiPlace || mallId} (${coords.lat}°N, ${coords.lon}°E)`
  } else {
    const SEASON_TEMP: Record<string, number> = { spring: 8, summer: 20, autumn: 6, winter: -4 }
    const SEASON_CONDITIONS: Record<string, { condition: string; description: string; icon: string }> = {
      spring: { condition: 'Cloudy', description: 'Mostly cloudy', icon: '04d' },
      summer: { condition: 'Clear', description: 'Clear sky', icon: '01d' },
      autumn: { condition: 'Rain', description: 'Light rain', icon: '10d' },
      winter: { condition: 'Snow', description: 'Light snow', icon: '13d' },
    }
    const hour = now.getHours()
    const diurnalDelta = hour >= 6 && hour <= 15 ? 3 : hour >= 16 && hour <= 20 ? 1 : -2
    temperature = Math.round((SEASON_TEMP[season] + diurnalDelta) * 10) / 10
    const humidityBase: Record<string, number> = { spring: 72, summer: 58, autumn: 80, winter: 75 }
    humidity = humidityBase[season] + Math.floor(Math.random() * 6) - 3
    const windSpeedBase: Record<string, number> = { spring: 6, summer: 4, autumn: 8, winter: 5 }
    windSpeed = windSpeedBase[season] + Math.floor(Math.random() * 4) - 2
    const seasonCond = SEASON_CONDITIONS[season]
    condition = seasonCond.condition
    description = seasonCond.description
    icon = seasonCond.icon
    precipitation = condition === 'Rain' ? 1.2 : condition === 'Snow' ? 0.8 : 0
    source = `Stelthion Simulation — ${mallId} (${coords.lat}°N, ${coords.lon}°E)`
  }

  return NextResponse.json({
    temperature, humidity, windSpeed, condition, description, precipitation,
    comfortIndex: calculateComfortIndex(temperature, humidity, windSpeed),
    footfallImpact: calculateFootfallImpact(condition, temperature, windSpeed, precipitation),
    season, timeOfDay, icon, source,
    lat: coords.lat, lon: coords.lon, mallId,
    timestamp: obs?.timestamp ?? now.toISOString(),
    live: !!obs,
  }, {
    headers: { 'Cache-Control': 'public, max-age=600' },
  })
}
