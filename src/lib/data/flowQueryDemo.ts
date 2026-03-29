/**
 * Flow Query Demo Data Generator
 *
 * Produces deterministic visitor-flow breakdowns for any origin zone,
 * direction (outbound / inbound / between), hour, and day of week.
 * Uses the adjacency graph + zone visitor data for realistic numbers.
 */

import { IDEAPARK_ADJACENCY } from './ideaparkAdjacency';
import {
  IDEAPARK_ZONES,
  IDEAPARK_UPPER_ZONES,
  getZoneVisitors,
  type IdeaparkZone,
} from './ideaparkZones';
import type {
  FlowDirection,
  FlowEdge,
  FlowQueryResponse,
} from '@/lib/types/flowQuery';

const ALL_ZONES: IdeaparkZone[] = [...IDEAPARK_ZONES, ...IDEAPARK_UPPER_ZONES];

function findZone(id: string): IdeaparkZone | undefined {
  return ALL_ZONES.find((z) => z.id === id);
}

/**
 * Generate a flow query response with deterministic demo data.
 */
export function generateFlowQueryResponse(
  origin: string,
  direction: FlowDirection,
  hour: number,
  dayOfWeek: number,
  destination?: string
): FlowQueryResponse | null {
  const originZone = findZone(origin);
  if (!originZone) return null;

  const originData = getZoneVisitors(originZone, hour, dayOfWeek);

  if (direction === 'between' && destination) {
    return generateBetweenFlow(originZone, destination, hour, dayOfWeek, originData.visitors);
  }

  if (direction === 'inbound') {
    return generateInboundFlow(originZone, hour, dayOfWeek);
  }

  // Default: outbound
  return generateOutboundFlow(originZone, hour, dayOfWeek, originData.visitors);
}

function generateOutboundFlow(
  originZone: IdeaparkZone,
  hour: number,
  dayOfWeek: number,
  originVisitors: number
): FlowQueryResponse {
  const adjacency = IDEAPARK_ADJACENCY[originZone.id] || [];
  // ~60-75% of visitors move to adjacent zones
  const movingShare = 0.60 + (originZone.id.charCodeAt(0) % 5) * 0.03;
  const totalMoving = Math.round(originVisitors * movingShare);

  const edges: FlowEdge[] = adjacency.map((edge) => {
    const targetZone = findZone(edge.target);
    const visitors = Math.round(totalMoving * edge.weight);
    return {
      from: originZone.id,
      fromName: originZone.nameFi,
      to: edge.target,
      toName: targetZone?.nameFi || edge.target,
      visitors,
      share: edge.weight,
    };
  });

  edges.sort((a, b) => b.visitors - a.visitors);

  const totalVisitors = edges.reduce((s, e) => s + e.visitors, 0);
  const topDest = edges[0];

  return {
    origin: originZone.id,
    originName: originZone.nameFi,
    direction: 'outbound',
    totalVisitors,
    edges,
    narrativeEn: `From ${originZone.name}, ${totalVisitors.toLocaleString()} visitors move to adjacent zones. The top destination is ${topDest?.toName || 'N/A'} (${topDest?.visitors.toLocaleString() || 0} visitors, ${Math.round((topDest?.share || 0) * 100)}%).`,
    narrativeFi: `${originZone.nameFi}: ${totalVisitors.toLocaleString('fi-FI')} kävijää siirtyy viereisiin alueisiin. Suosituin kohde on ${topDest?.toName || 'N/A'} (${topDest?.visitors.toLocaleString('fi-FI')} kävijää, ${Math.round((topDest?.share || 0) * 100)} %).`,
    hour,
    dayOfWeek,
  };
}

function generateInboundFlow(
  originZone: IdeaparkZone,
  hour: number,
  dayOfWeek: number
): FlowQueryResponse {
  // Find all zones that have originZone.id as a target in their adjacency
  const edges: FlowEdge[] = [];

  for (const [zoneId, adjacency] of Object.entries(IDEAPARK_ADJACENCY)) {
    const edgeToOrigin = adjacency.find((e) => e.target === originZone.id);
    if (!edgeToOrigin) continue;

    const sourceZone = findZone(zoneId);
    if (!sourceZone) continue;

    const sourceData = getZoneVisitors(sourceZone, hour, dayOfWeek);
    const movingShare = 0.60 + (zoneId.charCodeAt(0) % 5) * 0.03;
    const visitors = Math.round(sourceData.visitors * movingShare * edgeToOrigin.weight);

    edges.push({
      from: zoneId,
      fromName: sourceZone.nameFi,
      to: originZone.id,
      toName: originZone.nameFi,
      visitors,
      share: edgeToOrigin.weight,
    });
  }

  edges.sort((a, b) => b.visitors - a.visitors);
  const totalVisitors = edges.reduce((s, e) => s + e.visitors, 0);
  const topSource = edges[0];

  return {
    origin: originZone.id,
    originName: originZone.nameFi,
    direction: 'inbound',
    totalVisitors,
    edges,
    narrativeEn: `${originZone.name} receives ${totalVisitors.toLocaleString()} visitors from adjacent zones. The top source is ${topSource?.fromName || 'N/A'} (${topSource?.visitors.toLocaleString() || 0} visitors).`,
    narrativeFi: `${originZone.nameFi} vastaanottaa ${totalVisitors.toLocaleString('fi-FI')} kävijää viereisiltä alueilta. Suurin lähde on ${topSource?.fromName || 'N/A'} (${topSource?.visitors.toLocaleString('fi-FI')} kävijää).`,
    hour,
    dayOfWeek,
  };
}

function generateBetweenFlow(
  originZone: IdeaparkZone,
  destinationId: string,
  hour: number,
  dayOfWeek: number,
  originVisitors: number
): FlowQueryResponse {
  const destZone = findZone(destinationId);
  if (!destZone) {
    return {
      origin: originZone.id,
      originName: originZone.nameFi,
      direction: 'between',
      destination: destinationId,
      destinationName: destinationId,
      totalVisitors: 0,
      edges: [],
      narrativeEn: 'Destination zone not found.',
      narrativeFi: 'Kohdealuetta ei löydy.',
      hour,
      dayOfWeek,
    };
  }

  // Check direct adjacency
  const adjacency = IDEAPARK_ADJACENCY[originZone.id] || [];
  const directEdge = adjacency.find((e) => e.target === destinationId);

  const movingShare = 0.60 + (originZone.id.charCodeAt(0) % 5) * 0.03;
  let visitors: number;
  let share: number;

  if (directEdge) {
    // Direct connection
    visitors = Math.round(originVisitors * movingShare * directEdge.weight);
    share = directEdge.weight;
  } else {
    // Indirect — estimate via shortest path (simplified: use 15% of direct equivalent)
    visitors = Math.round(originVisitors * movingShare * 0.08);
    share = 0.08;
  }

  const edge: FlowEdge = {
    from: originZone.id,
    fromName: originZone.nameFi,
    to: destinationId,
    toName: destZone.nameFi,
    visitors,
    share,
  };

  const isAdjacent = !!directEdge;

  return {
    origin: originZone.id,
    originName: originZone.nameFi,
    direction: 'between',
    destination: destinationId,
    destinationName: destZone.nameFi,
    totalVisitors: visitors,
    edges: [edge],
    narrativeEn: `${visitors.toLocaleString()} visitors flow from ${originZone.name} to ${destZone.name}${isAdjacent ? ' (directly adjacent)' : ' (indirect route)'}, representing ${Math.round(share * 100)}% of outbound traffic.`,
    narrativeFi: `${visitors.toLocaleString('fi-FI')} kävijää siirtyy alueelta ${originZone.nameFi} alueelle ${destZone.nameFi}${isAdjacent ? ' (suoraan vierekkäin)' : ' (epäsuora reitti)'}, mikä vastaa ${Math.round(share * 100)} % lähtevästä liikenteestä.`,
    hour,
    dayOfWeek,
  };
}
