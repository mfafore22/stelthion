import type { RawSignalInput } from '../types.js';
import type { MarketConfig } from '../registry/market-schema.js';
import type {
  Decision,
  LifecycleState,
  MetricsSnapshot,
  PhenomenonType,
  Scope,
} from '../policy/policy-types.js';

import { resolveLocality } from '../locality/locality-resolver.js';
import {
  proximityWeight,
  type MarketProximityContext,
} from '../locality/proximity.js';
import { classify } from '../taxonomy/classifier.js';
import { computeLifecycle } from '../taxonomy/lifecycle.js';
import {
  inferLinks,
  type InferredLink,
  type LinkablePhenomenon,
} from '../linking/link-inferrer.js';
import { applyLinkBoost } from '../linking/link-boost.js';
import { evaluate } from '../policy/policy-engine.js';

export interface HarnessPhenomenon {
  id: string;
  label: string;
  type: PhenomenonType;
  keywords: string[];
  footTraffic: { scope: Scope; localityId: string };
  cultural: { scope: Scope; localityId: string };
  lifecycleState: LifecycleState | null;
  eventStart?: Date;
  eventEnd?: Date;
  signalCount: number;
  velocity: number;
  acceleration: number;
  footTrafficProximity: number;
  culturalProximity: number;
  footTrafficScore: number;
  culturalScore: number;
  linkBoost: number;
  compositeScore: number;
  decision: Decision;
  reasons: string[];
  thresholdKey: string;
  eventDriven: boolean;
}

export interface HarnessResult {
  marketId: string;
  now: Date;
  phenomena: HarnessPhenomenon[];
  links: InferredLink[];
}

/**
 * Cluster signals by a coarse key derived from the title before any
 * " — " separator. Synthetic scenarios put the scenario label first, so
 * this groups all signals of a scenario into a single phenomenon without
 * needing an embedding model. Good enough for the harness; real clustering
 * still lives in engine/clustering.ts.
 */
function clusterKey(signal: RawSignalInput): string {
  const [first] = signal.title.split(' — ');
  return first.trim().toLowerCase();
}

function computeVelocityAndAcceleration(
  signals: RawSignalInput[],
  now: Date,
): { velocity: number; acceleration: number; signalCount: number } {
  const dayMs = 86_400_000;
  const recentCutoff = now.getTime() - 3 * dayMs;
  const priorCutoff = now.getTime() - 7 * dayMs;

  let recent = 0;
  let prior = 0;
  for (const s of signals) {
    const t = s.publishedAt.getTime();
    if (t >= recentCutoff) recent++;
    else if (t >= priorCutoff) prior++;
  }
  // Normalise to per-day rates over each window length.
  const recentRate = recent / 3;
  const priorRate = prior / 4;
  const velocity = recentRate;
  const acceleration = recentRate - priorRate;
  return { velocity, acceleration, signalCount: signals.length };
}

function marketContext(market: MarketConfig, axis: 'footTraffic' | 'cultural'): MarketProximityContext {
  return {
    anchor:
      market.geoAnchorLat != null && market.geoAnchorLon != null
        ? { lat: market.geoAnchorLat, lon: market.geoAnchorLon }
        : null,
    country: market.country,
    region: market.region ?? null,
    subscriptions: axis === 'footTraffic' ? market.footTrafficSubs : market.culturalSubs,
  };
}

/**
 * In-process pipeline harness: no DB, no queue, no LLM calls. Composes the
 * Phase 2 pure modules so tests can assert end-to-end behaviour against
 * synthetic signals deterministically.
 *
 * Scope: resolveLocality → trivial clustering → classify → score → link
 * inference + boost → policy evaluate. Cross-market isolation is naturally
 * enforced because each call takes one market; callers invoke it per
 * market and compare outcomes.
 */
export function runPipelineForMarket(
  market: MarketConfig,
  signals: RawSignalInput[],
  now: Date,
): HarnessResult {
  // 1. Group signals into clusters and resolve locality per cluster.
  const clusters = new Map<string, RawSignalInput[]>();
  for (const signal of signals) {
    const key = clusterKey(signal);
    const bucket = clusters.get(key);
    if (bucket) bucket.push(signal);
    else clusters.set(key, [signal]);
  }

  const phenomena: HarnessPhenomenon[] = [];
  const linkables: LinkablePhenomenon[] = [];

  for (const [key, bucketSignals] of clusters) {
    // Use the first signal for locality resolution (all signals in a cluster
    // share the same cluster key and typically the same place reference).
    const representative = bucketSignals[0];
    const locality = resolveLocality(representative, market);

    const keywords = bucketSignals[0].summary
      ? bucketSignals[0].summary.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const classification = classify(
      {
        label: key,
        description: bucketSignals[0].summary ?? '',
        keywords,
      },
      now,
    );

    const lifecycle = computeLifecycle(
      {
        phenomenonType: classification.type,
        eventStart: classification.eventStart ?? null,
        eventEnd: classification.eventEnd ?? null,
      },
      now,
    );

    const { velocity, acceleration, signalCount } = computeVelocityAndAcceleration(
      bucketSignals,
      now,
    );

    const footTrafficProximity = proximityWeight(
      { scope: locality.footTraffic.scope, localityId: locality.footTraffic.localityId },
      marketContext(market, 'footTraffic'),
      'footTraffic',
    );
    const culturalProximity = proximityWeight(
      { scope: locality.cultural.scope, localityId: locality.cultural.localityId },
      marketContext(market, 'cultural'),
      'cultural',
    );

    const raw = Math.min(1, velocity / 10); // normalise toy velocity into [0, 1]
    const footTrafficScore = raw * footTrafficProximity;
    const culturalScore = raw * culturalProximity;

    phenomena.push({
      id: key,
      label: key,
      type: classification.type,
      keywords,
      footTraffic: { scope: locality.footTraffic.scope, localityId: locality.footTraffic.localityId },
      cultural: { scope: locality.cultural.scope, localityId: locality.cultural.localityId },
      lifecycleState: lifecycle,
      eventStart: classification.eventStart,
      eventEnd: classification.eventEnd,
      signalCount,
      velocity,
      acceleration,
      footTrafficProximity,
      culturalProximity,
      footTrafficScore,
      culturalScore,
      linkBoost: 0,
      compositeScore: 0,
      decision: 'REJECT',
      reasons: classification.reasons,
      thresholdKey: '',
      eventDriven: false,
    });

    linkables.push({
      id: key,
      label: key,
      keywords,
      type: classification.type,
      culturalScope: locality.cultural.scope,
      culturalLocality: locality.cultural.localityId,
      eventStart: classification.eventStart ?? null,
      eventEnd: classification.eventEnd ?? null,
      lifecycleState: lifecycle,
    });
  }

  // 2. Infer links across phenomena once all are in hand.
  const links: InferredLink[] = [];
  for (const p of linkables) {
    const candidates = linkables.filter((c) => c.id !== p.id);
    for (const link of inferLinks(p, candidates, now)) {
      links.push(link);
    }
  }

  // 3. Apply link boosts to TRENDs, finalise composite score + decision.
  for (const p of phenomena) {
    if (p.type === 'TREND') {
      const contributors = phenomena
        .filter((c) => c.type !== 'TREND' && c.lifecycleState === 'ACTIVE')
        .map((c) => ({ id: c.id, velocity: c.velocity, lifecycleState: c.lifecycleState }));
      const boost = applyLinkBoost({ id: p.id, velocity: p.velocity }, links, contributors);
      p.linkBoost = boost.boost;
      p.eventDriven = boost.eventDriven;
    }

    p.compositeScore =
      market.footTrafficAxisWeight * p.footTrafficScore +
      market.culturalAxisWeight * p.culturalScore +
      p.linkBoost;

    const snapshot: MetricsSnapshot = {
      date: now.toISOString().slice(0, 10),
      marketId: market.id,
      country: market.country,
      phenomenonId: p.id,
      phenomenonType: p.type,
      lifecycleState: p.lifecycleState,
      culturalScope: p.cultural.scope,
      culturalLocality: p.cultural.localityId,
      footTrafficScope: p.footTraffic.scope,
      footTrafficLocality: p.footTraffic.localityId,
      volume: p.signalCount,
      velocity: p.velocity,
      acceleration: p.acceleration,
      sourceDiversity: 1,
      strongSourceCount: p.signalCount,
      noiseAdjusted: p.velocity,
      footTrafficScore: p.footTrafficScore,
      culturalScore: p.culturalScore,
      footTrafficProximity: p.footTrafficProximity,
      culturalProximity: p.culturalProximity,
      linkBoost: p.linkBoost,
      compositeScore: p.compositeScore,
      negativeFeedback: 0,
      positiveFeedback: 0,
    };

    const result = evaluate({ snapshot, policy: market.policy });
    p.decision = result.decision;
    p.reasons = [...p.reasons, ...result.reasons];
    p.thresholdKey = result.thresholdKey;
  }

  return { marketId: market.id, now, phenomena, links };
}
