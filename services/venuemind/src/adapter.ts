import {
  literalText,
  type EnrichedSignal,
  type IntelligenceDomainAdapter,
  type MemoryDocument,
  type RawSignal,
  type RuntimeContext,
  type UserFacingResult,
} from '@stelthion/intelligence-runtime';
import { getVenueMindDemo } from './engine.js';

export const venueMindAdapter: IntelligenceDomainAdapter = {
  domain: 'venuemind',
  async collectSources(context) {
    const venue = getVenueMindDemo(context.scope.venueId);
    const events = venue.events.map((event): RawSignal => ({
      id: event.id,
      title: event.title,
      body: event.note,
      sourceId: `venuemind:event:${event.id}`,
      observedAt: event.date,
      metadata: { kind: 'event', venueId: venue.id, expectedGuests: event.expectedGuests },
    }));
    const zones = venue.zones.map((zone): RawSignal => ({
      id: zone.id,
      title: zone.name,
      body: `${zone.category} zone, sensor ready: ${zone.sensorReady}`,
      sourceId: `venuemind:zone:${zone.id}`,
      observedAt: new Date().toISOString(),
      metadata: { kind: 'zone', venueId: venue.id, capacity: zone.capacity ?? null },
    }));
    return [...events, ...zones];
  },
  async enrichSignal(signal) {
    return {
      ...signal,
      entityIds: [String(signal.metadata?.venueId ?? 'venue')],
      categories: [String(signal.metadata?.kind ?? 'venue_signal')],
      summary: signal.body,
    };
  },
  async buildMemoryDocument(signal, context) {
    return signalToMemoryDocument(signal, context);
  },
  async scoreRelevance(document) {
    const isEvent = document.metadata?.kind === 'event';
    return {
      entityId: document.entityIds[0] ?? document.id,
      relevance: isEvent ? 0.86 : 0.68,
      confidence: isEvent ? 0.78 : 0.7,
      sourceStrength: document.sensitivity === 'operator_review' ? 0.72 : 0.66,
      reasons: isEvent ? ['scheduled_event', 'expected_attendance'] : ['zone_capacity'],
    };
  },
  async createUserResult(document, score, quality) {
    return {
      id: document.id,
      title: literalText(document.title),
      summary: literalText(document.body),
      quality,
      sourceIds: document.sourceIds,
      metadata: { score },
    } satisfies UserFacingResult;
  },
};

function signalToMemoryDocument(
  signal: EnrichedSignal,
  context: RuntimeContext,
): MemoryDocument {
  const kind = signal.metadata?.kind === 'event' ? 'fresh_signal' : 'background_context';
  return {
    id: `venuemind:${signal.id}`,
    domain: 'venuemind',
    tier: kind,
    scope: context.scope,
    title: signal.title,
    body: signal.summary ?? signal.body ?? signal.title,
    sourceIds: [signal.sourceId],
    entityIds: signal.entityIds,
    freshnessAt: signal.observedAt,
    sensitivity: 'customer_scoped',
    metadata: signal.metadata,
  };
}
