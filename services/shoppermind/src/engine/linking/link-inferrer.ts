import type { PhenomenonType, Scope, LifecycleState } from '../policy/policy-types.js';

export type LinkType =
  | 'CONTRIBUTES_TO'
  | 'MANIFESTATION_OF'
  | 'ACCELERATES'
  | 'PRECEDES'
  | 'CONTRADICTS';

export interface LinkablePhenomenon {
  id: string;
  label: string;
  keywords: string[];
  type: PhenomenonType;
  culturalScope: Scope;
  culturalLocality: string;
  eventStart?: Date | null;
  eventEnd?: Date | null;
  lifecycleState?: LifecycleState | null;
}

export interface InferredLink {
  fromPhenomenonId: string;
  toPhenomenonId: string;
  linkType: LinkType;
  weight: number;
  rationale: string;
}

function normalizeKeywords(keywords: string[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const kw of keywords ?? []) {
    const clean = kw.toLowerCase().trim();
    if (clean.length >= 3) out.add(clean);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function sharesCulturalScope(a: LinkablePhenomenon, b: LinkablePhenomenon): boolean {
  if (a.culturalScope === 'GLOBAL' || b.culturalScope === 'GLOBAL') return true;
  return a.culturalLocality === b.culturalLocality;
}

const MIN_JACCARD = 0.15;

/**
 * Infer links from a target phenomenon to each candidate in the same
 * cultural scope. Topic overlap via keyword Jaccard + type-based rules.
 *
 * An embedding-based variant is a natural Phase 3 upgrade; this version
 * is deterministic and dependency-free so the pipeline harness can assert
 * link-creation behaviour without hitting an LLM.
 */
export function inferLinks(
  target: LinkablePhenomenon,
  candidates: LinkablePhenomenon[],
  now: Date = new Date(),
): InferredLink[] {
  const out: InferredLink[] = [];
  const targetKws = normalizeKeywords(target.keywords);

  for (const candidate of candidates) {
    if (candidate.id === target.id) continue;
    if (!sharesCulturalScope(target, candidate)) continue;

    const candidateKws = normalizeKeywords(candidate.keywords);
    const overlap = jaccard(targetKws, candidateKws);
    if (overlap < MIN_JACCARD) continue;

    // Rule 1: CAMPAIGN PRECEDES next instance when names overlap heavily and
    // candidate's event finished before target's starts.
    if (
      target.type === 'CAMPAIGN' &&
      candidate.type === 'CAMPAIGN' &&
      overlap > 0.4 &&
      candidate.eventEnd &&
      target.eventStart &&
      candidate.eventEnd < target.eventStart
    ) {
      out.push({
        fromPhenomenonId: candidate.id,
        toPhenomenonId: target.id,
        linkType: 'PRECEDES',
        weight: Math.min(0.9, overlap + 0.1),
        rationale: `prior ${candidate.label} preceded ${target.label} (jaccard=${overlap.toFixed(2)})`,
      });
      continue;
    }

    // Rule 2: EVENT or CAMPAIGN is a MANIFESTATION_OF an overlapping TREND
    if (
      (target.type === 'EVENT' || target.type === 'CAMPAIGN') &&
      candidate.type === 'TREND'
    ) {
      out.push({
        fromPhenomenonId: target.id,
        toPhenomenonId: candidate.id,
        linkType: 'MANIFESTATION_OF',
        weight: Math.min(0.9, overlap + 0.1),
        rationale: `${target.label} (${target.type}) manifests the ${candidate.label} trend`,
      });
      continue;
    }

    // Rule 3: INCIDENT ACCELERATES an overlapping TREND
    if (target.type === 'INCIDENT' && candidate.type === 'TREND') {
      out.push({
        fromPhenomenonId: target.id,
        toPhenomenonId: candidate.id,
        linkType: 'ACCELERATES',
        weight: Math.min(0.9, overlap),
        rationale: `${target.label} incident accelerates the ${candidate.label} trend`,
      });
      continue;
    }

    // Rule 4: Same-type overlap (trend↔trend, event↔event) → CONTRIBUTES_TO
    if (target.type === candidate.type && overlap >= MIN_JACCARD) {
      out.push({
        fromPhenomenonId: target.id,
        toPhenomenonId: candidate.id,
        linkType: 'CONTRIBUTES_TO',
        weight: Math.min(0.8, overlap),
        rationale: `shared ${target.type.toLowerCase()} topic (jaccard=${overlap.toFixed(2)})`,
      });
      continue;
    }

    // Rule 5: Default CONTRIBUTES_TO when overlap is strong enough
    if (overlap >= 0.25) {
      out.push({
        fromPhenomenonId: target.id,
        toPhenomenonId: candidate.id,
        linkType: 'CONTRIBUTES_TO',
        weight: Math.min(0.7, overlap),
        rationale: `topical overlap (jaccard=${overlap.toFixed(2)})`,
      });
    }
  }

  void now;
  return out;
}
