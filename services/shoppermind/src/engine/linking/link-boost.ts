import type { LifecycleState } from '../policy/policy-types.js';
import type { LinkType } from './link-inferrer.js';

export interface LinkForBoost {
  fromPhenomenonId: string;
  toPhenomenonId: string;
  linkType: LinkType;
  weight: number;
}

export interface ContributorPhenomenon {
  id: string;
  velocity: number;
  lifecycleState: LifecycleState | null;
}

export interface LinkBoostResult {
  boost: number;
  eventDriven: boolean;
  contributors: Array<{ id: string; contribution: number }>;
}

const MAX_BOOST_FRACTION = 0.2; // cap at 20% of native velocity
const PER_LINK_CAP = 0.3; // each link contributes at most 30% of its source's velocity
const EVENT_DRIVEN_THRESHOLD = 0.5; // if one link supplies >=50% of boost → eventDriven

/**
 * Compute a velocity boost for a trend phenomenon from its linked, ACTIVE
 * events / campaigns / incidents in the same cultural scope. Links of type
 * CONTRIBUTES_TO, MANIFESTATION_OF, ACCELERATES all contribute; PRECEDES and
 * CONTRADICTS do not.
 *
 * The boost is capped at MAX_BOOST_FRACTION of the trend's own velocity so
 * that a trend can't be artificially inflated by a single loud event. When
 * one contributor supplies more than EVENT_DRIVEN_THRESHOLD of the boost,
 * the trend is flagged as event-driven — the UI surfaces this so readers
 * know the bulk of today's signal comes from one specific happening.
 */
export function applyLinkBoost(
  trend: { id: string; velocity: number },
  links: LinkForBoost[],
  contributors: ContributorPhenomenon[],
): LinkBoostResult {
  if (trend.velocity <= 0 || links.length === 0) {
    return { boost: 0, eventDriven: false, contributors: [] };
  }

  const contributorMap = new Map<string, ContributorPhenomenon>();
  for (const c of contributors) contributorMap.set(c.id, c);

  const contributions: Array<{ id: string; contribution: number }> = [];

  for (const link of links) {
    if (link.toPhenomenonId !== trend.id) continue;
    if (
      link.linkType !== 'CONTRIBUTES_TO' &&
      link.linkType !== 'MANIFESTATION_OF' &&
      link.linkType !== 'ACCELERATES'
    ) {
      continue;
    }
    const contributor = contributorMap.get(link.fromPhenomenonId);
    if (!contributor) continue;
    if (contributor.lifecycleState !== 'ACTIVE') continue;
    if (contributor.velocity <= 0) continue;

    const contribution = contributor.velocity * Math.min(PER_LINK_CAP, link.weight);
    contributions.push({ id: contributor.id, contribution });
  }

  const rawBoost = contributions.reduce((a, b) => a + b.contribution, 0);
  const cap = trend.velocity * MAX_BOOST_FRACTION;
  const boost = Math.min(rawBoost, cap);

  const largest = contributions.reduce(
    (m, c) => (c.contribution > m ? c.contribution : m),
    0,
  );
  const eventDriven =
    boost > 0 && largest / (rawBoost || 1) >= EVENT_DRIVEN_THRESHOLD;

  return { boost, eventDriven, contributors: contributions };
}
