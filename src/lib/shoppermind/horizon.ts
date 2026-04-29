import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';

export type Horizon = 'short' | 'medium' | 'long';

// TODO: lift this classification to a server-side `timeHorizon` enum on the
// Phenomenon model (shoppermind service schema) so editors can override.
// Until then, classify client-side from existing fields. The verbs are:
//   short  = Hyödynnä (capture this season)
//   medium = Valmistaudu (prepare for 1–3 years)
//   long   = Uudelleenjärjestele (restructure / industry-shaping)

const STRUCTURAL_HINTS = [
  'demograf', 'ikääntym',
  'sustainab', 'kestäv', 'climate', 'ilmasto', 'esg',
  'regulat', 'sääntel', 'compliance',
  'urbaniz', 'kaupungistum',
  'circular', 'kiertotalous',
];

function isStructural(p: PhenomenonSummary): boolean {
  const tags = [...(p.categories ?? []), ...(p.keywords ?? [])].map((s) => s.toLowerCase());
  return tags.some((t) => STRUCTURAL_HINTS.some((h) => t.includes(h)));
}

export function classifyHorizon(p: PhenomenonSummary): Horizon {
  if (isStructural(p)) return 'long';
  if (p.phenomenonType === 'EVENT' || p.phenomenonType === 'CAMPAIGN' || p.phenomenonType === 'INCIDENT') {
    return 'short';
  }
  if (p.state === 'ACCELERATING') return 'short';
  return 'medium';
}

export function groupByHorizon(items: PhenomenonSummary[]): Record<Horizon, PhenomenonSummary[]> {
  const out: Record<Horizon, PhenomenonSummary[]> = { short: [], medium: [], long: [] };
  for (const p of items) out[classifyHorizon(p)].push(p);
  return out;
}
