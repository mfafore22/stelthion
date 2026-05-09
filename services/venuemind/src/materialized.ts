import {
  DEFAULT_MATERIALIZATION_POLICY,
  createMaterializedInsight,
  refreshMaterializedFreshness,
  type MaterializedInsight,
} from '@stelthion/intelligence-runtime';
import { buildVenueBrief, buildVenueMindSignal, getVenueMindDemo } from './engine.js';
import { buildVenueQualityView, type VenueQualityView } from './quality.js';
import type { VenueMindDemo } from './types.js';

interface VenueOverviewValue {
  venueId: string;
  venue: VenueMindDemo;
  signal: string;
  brief: string;
  qualityView: VenueQualityView;
}

type VenueOverviewInsight = MaterializedInsight<VenueOverviewValue>;

export interface VenueOverviewSnapshot extends VenueOverviewValue {
  materializedAt: string;
  expiresAt: string;
  freshness: 'fresh' | 'stale';
}

const overviewCache = new Map<string, VenueOverviewInsight>();

export function getVenueMindOverview(
  venueId?: string | null,
  now = new Date(),
): VenueOverviewSnapshot {
  const venue = getVenueMindDemo(venueId);
  const cached = overviewCache.get(venue.id);
  if (cached) return flatten(refreshMaterializedFreshness(cached, now));
  return materializeVenueMindOverview(venue.id, now);
}

export function materializeVenueMindOverview(
  venueId?: string | null,
  now = new Date(),
): VenueOverviewSnapshot {
  const venue = getVenueMindDemo(venueId);
  const insight = createMaterializedInsight({
    domain: 'venuemind',
    kind: 'overview',
    scope: { venueId: venue.id },
    policy: DEFAULT_MATERIALIZATION_POLICY,
    now,
    value: {
      venueId: venue.id,
      venue,
      signal: buildVenueMindSignal(venue),
      brief: buildVenueBrief(venue),
      qualityView: buildVenueQualityView(venue, now),
    },
  });
  overviewCache.set(venue.id, insight);
  return flatten(insight);
}

export function invalidateVenueMindOverview(venueId?: string | null): number {
  if (!venueId) {
    const count = overviewCache.size;
    overviewCache.clear();
    return count;
  }
  return overviewCache.delete(venueId) ? 1 : 0;
}

function flatten(insight: VenueOverviewInsight): VenueOverviewSnapshot {
  return {
    ...insight.value,
    materializedAt: insight.materializedAt,
    expiresAt: insight.expiresAt,
    freshness: insight.freshness,
  };
}
