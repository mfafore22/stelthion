import {
  buildQualityEnvelope,
  type QualityEnvelope,
} from '@stelthion/intelligence-runtime';
import type { VenueMindDemo } from './types.js';

export interface VenueQualityView {
  freshness: QualityEnvelope['freshness'];
  quality: QualityEnvelope;
  evidence: { sourceCount: number; strongSourceCount: number; sourceIds: string[] };
  decisionReasons: string[];
  handlingMode: QualityEnvelope['handling'];
}

export function buildVenueQualityView(
  venue: VenueMindDemo,
  now: Date,
): VenueQualityView {
  const nextEvent = venue.events[0];
  const sensorReady = venue.zones.filter((zone) => zone.sensorReady).length;
  const quality = buildQualityEnvelope({
    confidence: Math.min(0.95, 0.55 + sensorReady * 0.1),
    sourceStrength: Math.min(1, sensorReady / Math.max(venue.zones.length, 1)),
    sourceCount: venue.events.length + sensorReady,
    lastObservedAt: nextEvent ? new Date(nextEvent.date) : now,
    lifecycleRisk: nextEvent && new Date(nextEvent.date) < now ? 0.7 : 0,
  });
  return {
    freshness: quality.freshness,
    quality,
    evidence: {
      sourceCount: venue.events.length + sensorReady,
      strongSourceCount: sensorReady,
      sourceIds: venue.events.map((event) => event.id),
    },
    decisionReasons: quality.reasons,
    handlingMode: quality.handling,
  };
}
