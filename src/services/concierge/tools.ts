/**
 * Concierge Tool Definitions
 *
 * Each tool wraps an internal data source function.
 * Tools return both structured data (for UI attachment cards)
 * and a text summary (for the LLM to incorporate in its response).
 */

import { fetchFmiObservation, fetchFmiForecast, classifyCondition, classifyForecastCondition } from '@/lib/weather/fmi';
import { getMallCoordinates } from '@/lib/weather/utils';
import { getIdeaparkUpcomingEvents } from '@/lib/data/ideaparkEvents';
import { getZoneVisitors, IDEAPARK_ZONES, IDEAPARK_UPPER_ZONES } from '@/lib/data/ideaparkZones';
import { IDEAPARK_ADJACENCY, getAllZoneIds, areAdjacent } from '@/lib/data/ideaparkAdjacency';
import { GROUND_FLOOR_STORES, GROUND_FLOOR_ENTRANCES } from '@/lib/data/ideaparkStorePositions';
import {
  getIdeaparkParkingSnapshot,
  getIdeaparkLiveDepartures,
  ideaparkCatchmentDemographics,
} from '@/lib/data/ideaparkTransport';
import prisma from '@/app/lib/prisma';
import { getCounterProfile, getLiveFootfall } from '@/lib/data/liveFootfall';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';
import { tServer, weekdayName } from './tool-i18n';

// ── Types ─────────────────────────────────────────────────

export interface ToolResult {
  text: string;
  attachment?: {
    type: string;
    title: string;
    data: unknown;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    enum?: string[];
  }>;
  execute: (params: Record<string, unknown>, mallId: string, language?: string) => Promise<ToolResult>;
}

// ── Tool Implementations ──────────────────────────────────

async function getCurrentWeather(_params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const coords = getMallCoordinates(mallId);
  const obs = await fetchFmiObservation(coords.lat, coords.lon, coords.fmiPlace);

  if (!obs) {
    return { text: 'Weather data is currently unavailable from FMI.' };
  }

  const condition = classifyCondition(obs.cloudiness, obs.precipitation1h, obs.temperature);

  const data = {
    temperature: obs.temperature,
    humidity: obs.humidity,
    windSpeedKmh: obs.windSpeedKmh,
    precipitation1h: obs.precipitation1h,
    cloudiness: obs.cloudiness,
    condition: condition.condition,
    description: condition.description,
    icon: condition.icon,
    timestamp: obs.timestamp,
  };

  return {
    text: `Current weather: ${obs.temperature}°C, ${condition.condition}. Wind ${obs.windSpeedKmh} km/h, humidity ${obs.humidity}%. ${obs.precipitation1h > 0 ? `Rain: ${obs.precipitation1h} mm/h.` : 'No precipitation.'}`,
    attachment: { type: 'weather_card', title: tServer(language, 'concierge.attachments.weather.currentTitle'), data },
  };
}

async function getWeatherForecast(params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const coords = getMallCoordinates(mallId);
  const hours = typeof params.hours === 'number' ? params.hours : 120;
  const forecast = await fetchFmiForecast(coords.lat, coords.lon, hours, coords.fmiPlace);

  if (!forecast.length) {
    return { text: 'Forecast data is currently unavailable from FMI.' };
  }

  // If a specific date was requested, filter to that date
  const targetDate = params.date as string | undefined;
  let filtered = forecast;
  if (targetDate) {
    filtered = forecast.filter(f => f.time.startsWith(targetDate));
  }

  const summary = filtered.slice(0, 8).map(f => {
    const cond = classifyForecastCondition(f.precipitation1h, f.temperature);
    const time = new Date(f.time).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    return `${time}: ${f.temperature}°C ${cond.condition}`;
  }).join(', ');

  return {
    text: `Forecast${targetDate ? ` for ${targetDate}` : ''}: ${summary}`,
    attachment: {
      type: 'weather_card',
      title: targetDate
        ? tServer(language, 'concierge.attachments.weather.forecastFor', { date: targetDate })
        : tServer(language, 'concierge.attachments.weather.forecastTitle'),
      data: filtered.slice(0, 24).map(f => ({
        time: f.time,
        temperature: f.temperature,
        windSpeedKmh: f.windSpeedKmh,
        precipitation1h: f.precipitation1h,
        condition: classifyForecastCondition(f.precipitation1h, f.temperature).condition,
      })),
    },
  };
}

async function getFootfallProfile(params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const profile = await getCounterProfile(mallId);

  if (!profile.dataAvailable || profile.hourlyProfile.length === 0) {
    return { text: 'No counter data available for this property.' };
  }

  const weekday = params.weekday as number | undefined;
  const filtered = weekday !== undefined
    ? profile.hourlyProfile.filter((p) => p.weekday === weekday)
    : profile.hourlyProfile;

  if (!filtered.length) {
    return { text: 'No counter data available for this property.' };
  }

  const peak = filtered.reduce((max, p) => (p.avg > max.avg ? p : max), filtered[0]);
  const dayLabel = weekday !== undefined ? weekdayName(language, weekday) : weekdayName(language, peak.weekday);

  return {
    text: weekday !== undefined
      ? `${dayLabel} footfall profile: peak at ${peak.hour}:00 with ~${peak.avg} visitors/hour. ${filtered.length} hourly data points.`
      : `Footfall profile available for all 7 weekdays. Overall peak: ${dayLabel} at ${peak.hour}:00 (~${peak.avg} visitors/hour).`,
    attachment: {
      type: 'footfall_sparkline',
      title: weekday !== undefined
        ? tServer(language, 'concierge.attachments.footfall.dayTitle', { day: dayLabel })
        : tServer(language, 'concierge.attachments.footfall.weeklyTitle'),
      data: filtered,
    },
  };
}

async function getFootfallForDate(params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const dateStr = params.date as string;
  const hour = params.hour as number | undefined;

  if (!dateStr) {
    return { text: 'Please provide a date (YYYY-MM-DD format).' };
  }

  const date = new Date(dateStr);
  const weekday = date.getDay();
  const dayLabel = weekdayName(language, weekday);

  const result = await getFootfallProfile({ weekday }, mallId, language);

  if (!result.attachment?.data) {
    return { text: `No historical data to estimate footfall for ${dateStr} (${dayLabel}).` };
  }

  const profile = result.attachment.data as Array<{ weekday: number; hour: number; avg: number }>;

  if (hour !== undefined) {
    const entry = profile.find(p => p.hour === hour);
    const estimate = entry?.avg ?? 0;
    return {
      text: `Expected footfall on ${dayLabel} ${dateStr} at ${hour}:00 — approximately ${estimate} visitors/hour (based on historical average).`,
      attachment: {
        type: 'footfall_sparkline',
        title: `${dayLabel} ${dateStr} ${hour}:00`,
        data: profile,
      },
    };
  }

  const total = profile.reduce((s, p) => s + p.avg, 0);
  const peak = profile.reduce((max, p) => p.avg > max.avg ? p : max, profile[0]);

  return {
    text: `Expected footfall on ${dayLabel} ${dateStr}: ~${total} total visitors. Peak at ${peak.hour}:00 (~${peak.avg}/hour).`,
    attachment: {
      type: 'footfall_sparkline',
      title: `${dayLabel} ${dateStr}`,
      data: profile,
    },
  };
}

async function getEvents(_params: Record<string, unknown>, _mallId: string, language?: string): Promise<ToolResult> {
  const data = getIdeaparkUpcomingEvents();
  const events = data.upcomingEvents;

  const summary = events.slice(0, 5).map(e => {
    const date = new Date(e.startDate).toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${e.title} — ${date} at ${e.venue} (~${e.expectedAttendance?.toLocaleString()} attendees)`;
  }).join('\n');

  return {
    text: `${events.length} upcoming events near Ideapark:\n${summary}`,
    attachment: {
      type: 'event_card',
      title: tServer(language, 'concierge.attachments.events.title'),
      data: events.slice(0, 10).map(e => ({
        name: e.title,
        date: e.startDate,
        venue: e.venue,
        type: e.category,
        expectedAttendance: e.expectedAttendance,
      })),
    },
  };
}

async function getParkingStatus(_params: Record<string, unknown>, _mallId: string, language?: string): Promise<ToolResult> {
  const snapshot = getIdeaparkParkingSnapshot(new Date());

  const levelSummary = snapshot.levels.map(l =>
    `${l.id}: ${l.currentOccupancy}/${l.capacity} (${Math.round(l.currentOccupancy / l.capacity * 100)}%)`
  ).join(', ');

  return {
    text: `Parking: ${Math.round(snapshot.currentUtilization)}% utilised. ${snapshot.publicSpaces - Math.round(snapshot.totalCapacity * snapshot.currentUtilization / 100)} spaces available. ${levelSummary}`,
    attachment: {
      type: 'parking_status',
      title: tServer(language, 'concierge.attachments.parking.title'),
      data: {
        levels: snapshot.levels,
        totalCapacity: snapshot.totalCapacity,
        currentUtilization: snapshot.currentUtilization,
        pricing: snapshot.pricing,
      },
    },
  };
}

async function getTransport(_params: Record<string, unknown>, _mallId: string, language?: string): Promise<ToolResult> {
  const departures = getIdeaparkLiveDepartures(new Date());

  const nextTrains = departures.vrTrains?.slice(0, 3).map(d =>
    `${d.scheduledTime} ${d.destination}${d.delayMinutes ? ` (${d.delayMinutes} min late)` : ''}`
  ).join(', ') || 'No train data';

  const nextBuses = departures.buses?.slice(0, 3).map(d =>
    `${d.scheduledTime} Line ${d.line} → ${d.destination}${d.delayMinutes ? ` (${d.delayMinutes} min late)` : ''}`
  ).join(', ') || 'No bus data';

  return {
    text: `Next trains: ${nextTrains}. Next buses: ${nextBuses}.`,
    attachment: {
      type: 'transport_card',
      title: tServer(language, 'concierge.attachments.transport.title'),
      data: {
        station: departures.station,
        trains: departures.vrTrains?.slice(0, 5) || [],
        buses: departures.buses?.slice(0, 5) || [],
        lastUpdated: departures.lastUpdated,
      },
    },
  };
}

async function getDemographics(_params: Record<string, unknown>, _mallId: string): Promise<ToolResult> {
  const demo = ideaparkCatchmentDemographics;
  const primary = demo.zones[0];

  return {
    text: `Catchment area: ${demo.zones.length} zones. Primary zone (${primary.driveTimeMinutes} min): ${primary.population.total.toLocaleString()} people, ${primary.population.households.toLocaleString()} households. Median income €${primary.income.medianHouseholdIncome.toLocaleString()}. Spending potential €${demo.spendingPotential.toLocaleString()}.`,
  };
}

async function getMallStats(_params: Record<string, unknown>, mallId: string): Promise<ToolResult> {
  const stats = await prisma.mallStats.findUnique({ where: { mallId } });
  const mall = await prisma.mall.findUnique({ where: { mallId }, select: { name: true, city: true, totalShops: true } });

  if (!stats || !mall) {
    return { text: 'Mall stats not available.' };
  }

  // Live current visitors from counter data — same resolution as Performance KPIs.
  const live = await getLiveFootfall(mallId);
  const currentVisitorsText = live.currentVisitors != null
    ? `${live.isEstimated ? '~' : ''}${live.currentVisitors.toLocaleString()}`
    : 'unavailable';

  return {
    text: `${mall.name} (${mall.city}): ${mall.totalShops} shops. Current visitors: ${currentVisitorsText}. Annual visitors: ${(stats.annualVisitors / 1_000_000).toFixed(1)}M. Annual sales: €${(stats.annualSales / 1_000_000).toFixed(0)}M. Avg dwell: ${stats.dwellTime} min. Conversion: ${stats.conversionRate}%.`,
  };
}

async function getCurrentVisitors(_params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const live = await getLiveFootfall(mallId);

  if (live.currentVisitors == null) {
    return { text: 'No counter data available for this property right now.' };
  }

  const prefix = live.isEstimated ? '~' : '';
  const yoy = live.prevYear
    ? ` (YoY ${live.currentVisitors > live.prevYear ? '+' : ''}${Math.round(((live.currentVisitors - live.prevYear) / live.prevYear) * 100)}%)`
    : '';

  return {
    text: `Current visitors (${live.hour}:00): ${prefix}${live.currentVisitors.toLocaleString()}${yoy}. Source: ${live.source === 'exact' ? 'live counter reading' : 'historical profile estimate'}.`,
    attachment: {
      type: 'footfall_sparkline',
      title: tServer(language, 'concierge.attachments.footfall.currentHourTitle'),
      data: [{ hour: live.hour, avg: live.currentVisitors, avgPrevYear: live.prevYear }],
    },
  };
}

async function getZoneInfo(params: Record<string, unknown>, mallId: string): Promise<ToolResult> {
  const zoneId = params.zoneId as string | undefined;
  const allZones = [...IDEAPARK_ZONES, ...IDEAPARK_UPPER_ZONES];

  if (zoneId) {
    const zone = allZones.find(z => z.id === zoneId);
    if (!zone) return { text: `Zone "${zoneId}" not found.` };

    const now = new Date();
    const visitors = getZoneVisitors(zone, now.getHours(), now.getDay());
    return {
      text: `Zone "${zone.nameFi}" (${zone.category}): ${zone.area_sqm} m², capacity ${zone.capacity}. Current visitors: ~${visitors.visitors} (${(visitors.density * 100).toFixed(1)}% density).`,
    };
  }

  const summary = allZones.map(z => `${z.id}: ${z.nameFi} (${z.category}, ${z.area_sqm} m²)`).join('\n');
  return {
    text: `${allZones.length} zones:\n${summary}`,
  };
}

async function getStoreInfo(params: Record<string, unknown>, _mallId: string): Promise<ToolResult> {
  const query = (params.name as string || '').toLowerCase();

  if (query) {
    const matches = GROUND_FLOOR_STORES.filter(s =>
      s.name.toLowerCase().includes(query) || s.slug.toLowerCase().includes(query)
    );

    if (!matches.length) return { text: `No store matching "${query}" found.` };

    const info = matches.map(s => `${s.name} — zone: ${s.zoneId}`).join(', ');
    return { text: `Found ${matches.length} store(s): ${info}.` };
  }

  return {
    text: `${GROUND_FLOOR_STORES.length} stores on ground floor, ${GROUND_FLOOR_ENTRANCES.length} main entrances.`,
  };
}

async function getZoneFlow(params: Record<string, unknown>, _mallId: string): Promise<ToolResult> {
  const zoneId = params.zoneId as string | undefined;

  if (zoneId) {
    const edges = IDEAPARK_ADJACENCY[zoneId];
    if (!edges) return { text: `Zone "${zoneId}" not found in adjacency graph.` };

    const connections = edges
      .sort((a, b) => b.weight - a.weight)
      .map(e => `→ ${e.target} (${(e.weight * 100).toFixed(0)}%${e.crossFloor ? ', cross-floor' : ''})`)
      .join('\n');

    return {
      text: `Zone "${zoneId}" connects to ${edges.length} zones:\n${connections}`,
    };
  }

  const allIds = getAllZoneIds();
  return {
    text: `${allIds.length} zones in adjacency graph. Pass a zoneId parameter to see specific connections.`,
  };
}

// ── ShopperMind: Trends & Phenomena ──────────────────────
// Delegates to the ShopperMind microservice via the typed client. When the
// service env vars (SHOPPERMIND_SERVICE_URL + SHOPPERMIND_SERVICE_TOKEN)
// aren't set the tool returns a "not active" message so the concierge
// continues to function without the service.

async function getShopperMindTrends(params: Record<string, unknown>, mallId: string, language?: string): Promise<ToolResult> {
  const marketId = (params.marketId as string) || resolveMarketIdFromMall(mallId);
  const country = (params.country as string)?.toUpperCase() ?? marketId.split('-').at(-1)?.toUpperCase() ?? '';

  const client = getShopperMindClient();
  if (!client) {
    return {
      text: `[Source: Stelthion ShopperMind] The ShopperMind trend engine is not yet active for ${country}. It will be available once the ShopperMind module is deployed.`,
    };
  }

  const state = params.state as string | undefined;
  const query = (params.query as string | undefined)?.toLowerCase();
  const limit = Math.min(Number(params.limit) || 5, 10);

  type PhenomStateValue = Parameters<typeof client.listPhenomena>[0]['state'];
  let market: Awaited<ReturnType<typeof client.getMarket>> | null = null;
  let phenomenaResp: Awaited<ReturnType<typeof client.listPhenomena>>;
  let sotdResp: Awaited<ReturnType<typeof client.getSignalOfTheDay>>;
  try {
    [market, phenomenaResp, sotdResp] = await Promise.all([
      client.getMarket(marketId).catch(() => null),
      client.listPhenomena({ marketId, state: state?.toUpperCase() as PhenomStateValue, limit: 30 }),
      client.getSignalOfTheDay({ marketId }),
    ]);
  } catch (err) {
    return {
      text: `[Source: Stelthion ShopperMind] Trend data for ${country} is temporarily unavailable (${err instanceof Error ? err.message : 'service error'}).`,
    };
  }

  const industryLabel =
    market?.industryFocus === 'property' ? 'property-industry' : 'retail';

  let results = [...phenomenaResp.phenomena].sort((a, b) => b.compositeScore - a.compositeScore);
  if (query) {
    results = results.filter(
      (r) => r.label.toLowerCase().includes(query) || r.description.toLowerCase().includes(query),
    );
  }
  results = results.slice(0, limit);

  const sotd = sotdResp.signalOfTheDay;

  if (results.length === 0 && !sotd) {
    return {
      text: `[Source: Stelthion ShopperMind] No ${industryLabel} phenomena tracked for ${country} yet. The ShopperMind engine is still collecting signals.`,
    };
  }

  const lines = results.map(
    (r) => `• ${r.label} [${r.state}] — score ${r.compositeScore.toFixed(2)}\n  ${r.description}`,
  );

  let text = `[Source: Stelthion ShopperMind — ${industryLabel} trends for ${country}]\n\n`;
  if (results.length > 0) {
    text += `Top phenomena:\n${lines.join('\n\n')}\n\n`;
  }
  if (sotd) {
    text += `Today's Signal of the Day:\n${sotd.narrative}`;
  }

  return {
    text,
    attachment: {
      type: 'shoppermind_trends',
      title: `${tServer(language, 'concierge.attachments.trends.title')} (${country})`,
      data: { country, marketId, phenomena: results, signalOfTheDay: sotd?.narrative },
    },
  };
}

// ── Tool Registry ─────────────────────────────────────────

export const CONCIERGE_TOOLS: ToolDefinition[] = [
  {
    name: 'get_current_weather',
    description: 'Get current weather at the property (temperature, wind, rain, conditions)',
    parameters: {},
    execute: getCurrentWeather,
  },
  {
    name: 'get_weather_forecast',
    description: 'Get weather forecast for the property (up to 5 days). Optionally filter by date.',
    parameters: {
      date: { type: 'string', description: 'Filter to a specific date (YYYY-MM-DD)', required: false },
      hours: { type: 'number', description: 'Forecast horizon in hours (default 120)', required: false },
    },
    execute: getWeatherForecast,
  },
  {
    name: 'get_footfall_profile',
    description: 'Get historical visitor profile averaged by weekday and hour. Optionally filter by weekday.',
    parameters: {
      weekday: { type: 'number', description: 'Filter to weekday (0=Sun, 1=Mon, ..., 6=Sat)', required: false },
    },
    execute: getFootfallProfile,
  },
  {
    name: 'get_footfall_for_date',
    description: 'Estimate expected footfall for a specific date and optionally a specific hour.',
    parameters: {
      date: { type: 'string', description: 'Target date (YYYY-MM-DD)', required: true },
      hour: { type: 'number', description: 'Specific hour (0-23)', required: false },
    },
    execute: getFootfallForDate,
  },
  {
    name: 'get_events',
    description: 'Get upcoming events near the property (concerts, sports, exhibitions within 25 km)',
    parameters: {},
    execute: getEvents,
  },
  {
    name: 'get_parking_status',
    description: 'Get current parking zone occupancy and availability',
    parameters: {},
    execute: getParkingStatus,
  },
  {
    name: 'get_transport',
    description: 'Get next bus and train departures from the property area',
    parameters: {},
    execute: getTransport,
  },
  {
    name: 'get_demographics',
    description: 'Get catchment area demographics (population, income, employment by drive-time zone)',
    parameters: {},
    execute: getDemographics,
  },
  {
    name: 'get_mall_stats',
    description: 'Get current mall KPIs (visitors, sales, dwell time, conversion rate)',
    parameters: {},
    execute: getMallStats,
  },
  {
    name: 'get_current_visitors',
    description: 'Get live visitor count for the current hour from counter readings (same source as Performance KPI).',
    parameters: {},
    execute: getCurrentVisitors,
  },
  {
    name: 'get_zone_info',
    description: 'Get information about floor plan zones. Optionally pass a zoneId for details.',
    parameters: {
      zoneId: { type: 'string', description: 'Specific zone ID (e.g. "west-anchor", "food-court")', required: false },
    },
    execute: getZoneInfo,
  },
  {
    name: 'get_store_info',
    description: 'Search for stores by name or list all stores.',
    parameters: {
      name: { type: 'string', description: 'Store name to search for', required: false },
    },
    execute: getStoreInfo,
  },
  {
    name: 'get_zone_flow',
    description: 'Get visitor flow connections between zones (adjacency graph with transition weights).',
    parameters: {
      zoneId: { type: 'string', description: 'Zone ID to show connections for', required: false },
    },
    execute: getZoneFlow,
  },
  {
    name: 'get_shoppermind_trends',
    description: 'Query Stelthion ShopperMind for current industry trends and phenomena. For Finland/Ideapark: retail and consumer trends, tenancy shifts, footfall drivers. For UAE/Dubai: property-industry trends — real estate, hospitality, commercial, residential. Returns scored phenomena with velocity/acceleration and the daily Signal of the Day narrative. Use this when the user asks about trends, market signals, what is emerging/fading, industry momentum, or competitive landscape.',
    parameters: {
      country: { type: 'string', description: 'Country code: "FI" for Finland/retail or "AE" for UAE/property (auto-detected from property if omitted)', required: false },
      query: { type: 'string', description: 'Search term to filter phenomena (e.g. "fashion", "off-plan", "hospitality")', required: false },
      category: { type: 'string', description: 'Category filter (e.g. "fashion", "f&b", "residential-sale", "hospitality")', required: false },
      state: { type: 'string', description: 'Phenomenon state filter: EMERGING, ACCELERATING, STABLE, FADING, DORMANT', required: false, enum: ['EMERGING', 'ACCELERATING', 'STABLE', 'FADING', 'DORMANT'] },
      limit: { type: 'number', description: 'Max phenomena to return (default 5, max 10)', required: false },
    },
    execute: getShopperMindTrends,
  },
];

/** Look up a tool by name */
export function findTool(name: string): ToolDefinition | undefined {
  return CONCIERGE_TOOLS.find(t => t.name === name);
}

/** Convert tool definitions to the JSON schema format expected by LLMs */
export function getToolSchemas() {
  return CONCIERGE_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([key, p]) => [key, {
          type: p.type,
          description: p.description,
          ...(p.enum ? { enum: p.enum } : {}),
        }])
      ),
      required: Object.entries(t.parameters)
        .filter(([, p]) => p.required)
        .map(([key]) => key),
    },
  }));
}
