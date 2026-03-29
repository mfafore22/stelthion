/**
 * FMI Open Data WFS 2.0 Client
 * Finnish Meteorological Institute — free, no API key required.
 *
 * Endpoints used:
 *   Observations: fmi::observations::weather::simple
 *   Forecast:     fmi::forecast::harmonie::surface::point::simple
 *
 * XML is parsed with lightweight regex — no XML library dependency.
 */

const FMI_BASE = 'https://opendata.fmi.fi/wfs';
const FMI_VERSION = '2.0.0';

// ---------- types ----------

export interface FmiObservation {
  temperature: number;      // °C
  humidity: number;         // %
  windSpeed: number;        // m/s (raw)
  windSpeedKmh: number;    // km/h (converted)
  precipitation1h: number;  // mm in last hour
  cloudiness: number;       // oktas 0-8
  timestamp: string;        // ISO
}

export interface FmiForecastPoint {
  time: string;             // ISO
  temperature: number;      // °C
  humidity: number;         // %
  windSpeed: number;        // m/s
  windSpeedKmh: number;    // km/h
  precipitation1h: number;  // mm
  cloudiness: number | null;
}

// ---------- observation fetcher ----------

/**
 * Fetch latest weather observation near given place/coordinates.
 * Uses `fmi::observations::weather::simple` stored query.
 * Prefers `place` parameter (reliable station lookup) over `latlon`.
 * Returns null on any failure (caller should fall back to simulation).
 */
export async function fetchFmiObservation(
  lat: number,
  lon: number,
  place?: string
): Promise<FmiObservation | null> {
  const base: Record<string, string> = {
    service: 'WFS',
    version: FMI_VERSION,
    request: 'getFeature',
    storedquery_id: 'fmi::observations::weather::simple',
    parameters: 't2m,rh,ws_10min,r_1h,n_man',
    timestep: '60',
    starttime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endtime: new Date().toISOString(),
  };

  // FMI place-based lookup is more reliable than latlon for finding stations
  if (place) {
    base.place = place;
  } else {
    base.latlon = `${lat},${lon}`;
  }

  const params = new URLSearchParams(base);

  try {
    const res = await fetch(`${FMI_BASE}?${params}`, {
      next: { revalidate: 600 }, // cache 10 min in Next.js fetch cache
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const xml = await res.text();
    return parseObservationXml(xml);
  } catch {
    return null;
  }
}

// ---------- forecast fetcher ----------

/**
 * Fetch point forecast (HARMONIE model) for the next ~2 days.
 * Uses `fmi::forecast::harmonie::surface::point::simple`.
 * Returns empty array on failure.
 */
export async function fetchFmiForecast(
  lat: number,
  lon: number,
  hours: number = 120,
  place?: string
): Promise<FmiForecastPoint[]> {
  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const base: Record<string, string> = {
    service: 'WFS',
    version: FMI_VERSION,
    request: 'getFeature',
    storedquery_id: 'fmi::forecast::harmonie::surface::point::simple',
    parameters: 'Temperature,Humidity,WindSpeedMS,Precipitation1h',
    timestep: '180', // 3-hour steps
    starttime: now.toISOString(),
    endtime: end.toISOString(),
  };

  if (place) {
    base.place = place;
  } else {
    base.latlon = `${lat},${lon}`;
  }

  const params = new URLSearchParams(base);

  try {
    const res = await fetch(`${FMI_BASE}?${params}`, {
      next: { revalidate: 3600 }, // cache 1 hour
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseForecastXml(xml);
  } catch {
    return [];
  }
}

// ---------- XML parsers ----------

/**
 * Parse BsWfs:BsWfsElement members from FMI simple feature XML.
 * Each member has: Time, ParameterName, ParameterValue.
 * We group by time, take the latest complete set.
 */
function parseObservationXml(xml: string): FmiObservation | null {
  const members = extractMembers(xml);
  if (members.length === 0) return null;

  // Group values by timestamp
  const grouped = new Map<string, Map<string, number>>();

  for (const m of members) {
    const time = extractTag(m, 'BsWfs:Time');
    const param = extractTag(m, 'BsWfs:ParameterName');
    const valueStr = extractTag(m, 'BsWfs:ParameterValue');
    if (!time || !param || !valueStr) continue;

    // FMI returns literal "NaN" for missing sensor readings — skip those
    if (valueStr === 'NaN') continue;
    const value = parseFloat(valueStr);
    if (isNaN(value)) continue;

    if (!grouped.has(time)) grouped.set(time, new Map());
    grouped.get(time)!.set(param, value);
  }

  // Find the latest timestamp that has temperature at minimum
  const sortedTimes = [...grouped.keys()].sort().reverse();

  for (const time of sortedTimes) {
    const vals = grouped.get(time)!;
    const temp = vals.get('t2m');
    if (temp === undefined) continue;

    const ws = vals.get('ws_10min') ?? 0;
    return {
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(vals.get('rh') ?? 70),
      windSpeed: Math.round(ws * 10) / 10,
      windSpeedKmh: Math.round(ws * 3.6 * 10) / 10,
      precipitation1h: Math.round((vals.get('r_1h') ?? 0) * 10) / 10,
      cloudiness: Math.round(vals.get('n_man') ?? 4),
      timestamp: time,
    };
  }

  return null;
}

/**
 * Parse forecast simple features into time-series points.
 */
function parseForecastXml(xml: string): FmiForecastPoint[] {
  const members = extractMembers(xml);
  if (members.length === 0) return [];

  const grouped = new Map<string, Map<string, number>>();

  for (const m of members) {
    const time = extractTag(m, 'BsWfs:Time');
    const param = extractTag(m, 'BsWfs:ParameterName');
    const valueStr = extractTag(m, 'BsWfs:ParameterValue');
    if (!time || !param || !valueStr) continue;

    if (valueStr === 'NaN') continue;
    const value = parseFloat(valueStr);
    if (isNaN(value)) continue;

    if (!grouped.has(time)) grouped.set(time, new Map());
    grouped.get(time)!.set(param, value);
  }

  const points: FmiForecastPoint[] = [];

  for (const [time, vals] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const temp = vals.get('Temperature');
    if (temp === undefined) continue;

    const ws = vals.get('WindSpeedMS') ?? 0;
    points.push({
      time,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(vals.get('Humidity') ?? 70),
      windSpeed: Math.round(ws * 10) / 10,
      windSpeedKmh: Math.round(ws * 3.6 * 10) / 10,
      precipitation1h: Math.round((vals.get('Precipitation1h') ?? 0) * 10) / 10,
      cloudiness: null, // HARMONIE doesn't always include cloud cover
    });
  }

  return points;
}

// ---------- XML helpers ----------

/** Extract all BsWfs:BsWfsElement member blocks */
function extractMembers(xml: string): string[] {
  const results: string[] = [];
  const regex = /<BsWfs:BsWfsElement[^>]*>([\s\S]*?)<\/BsWfs:BsWfsElement>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

/** Extract text content of a simple XML tag */
function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

// ---------- condition classification ----------

export type WeatherCondition =
  | 'Clear'
  | 'Partly Cloudy'
  | 'Cloudy'
  | 'Overcast'
  | 'Rain'
  | 'Heavy Rain'
  | 'Snow'
  | 'Sleet';

export interface ClassifiedCondition {
  condition: WeatherCondition;
  description: string;
  icon: string;
}

/**
 * Classify weather condition from observation parameters.
 * Uses cloud cover (oktas), precipitation, and temperature.
 */
export function classifyCondition(
  cloudiness: number,
  precipitation1h: number,
  temperature: number
): ClassifiedCondition {
  // Precipitation takes priority
  if (precipitation1h > 0.2) {
    if (temperature < 0) {
      return precipitation1h > 2
        ? { condition: 'Snow', description: 'Heavy snowfall', icon: '13d' }
        : { condition: 'Snow', description: 'Light snow', icon: '13d' };
    }
    if (temperature < 2) {
      return { condition: 'Sleet', description: 'Sleet', icon: '13d' };
    }
    return precipitation1h > 4
      ? { condition: 'Heavy Rain', description: 'Heavy rain', icon: '09d' }
      : { condition: 'Rain', description: 'Light rain', icon: '10d' };
  }

  // Cloud-based classification (oktas 0-8)
  if (cloudiness <= 1) return { condition: 'Clear', description: 'Clear sky', icon: '01d' };
  if (cloudiness <= 3) return { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: '02d' };
  if (cloudiness <= 5) return { condition: 'Cloudy', description: 'Mostly cloudy', icon: '03d' };
  if (cloudiness <= 7) return { condition: 'Overcast', description: 'Overcast', icon: '04d' };

  return { condition: 'Overcast', description: 'Overcast', icon: '04d' };
}

/**
 * Classify forecast point (may lack cloud data).
 */
export function classifyForecastCondition(
  precipitation1h: number,
  temperature: number
): ClassifiedCondition {
  if (precipitation1h > 0.2) {
    if (temperature < 0) {
      return { condition: 'Snow', description: 'Snow', icon: '13d' };
    }
    if (temperature < 2) {
      return { condition: 'Sleet', description: 'Sleet', icon: '13d' };
    }
    return precipitation1h > 4
      ? { condition: 'Heavy Rain', description: 'Heavy rain', icon: '09d' }
      : { condition: 'Rain', description: 'Light rain', icon: '10d' };
  }

  // Without cloud data, default to partly cloudy
  return { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: '02d' };
}
