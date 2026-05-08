import type { PhenomenonType } from '../policy/policy-types.js';

export interface ClassifierInput {
  label: string;
  description: string;
  keywords: string[];
}

export interface ClassifierResult {
  type: PhenomenonType;
  eventStart?: Date;
  eventEnd?: Date;
  confidence: number;
  reasons: string[];
}

// Keyword priors for type classification. Deliberately broad across
// human-behaviour domains: property is one lens among many. Add terms here
// as coverage widens into tourism, migration, transit, lifestyle, etc.
const EVENT_TERMS = [
  'fair', 'festival', 'conference', 'summit', 'exhibition', 'expo',
  'opening', 'launch', 'concert', 'championship', 'match', 'tournament',
  'pride', 'carnival', 'parade', 'race', 'marathon', 'olympics',
  'asuntomessut', 'habitare', 'slush', 'mwc', 'ces', 'biennale',
  'housing fair', 'trade show',
];

const CAMPAIGN_TERMS = [
  'black friday', 'cyber monday', 'hullut päivät', 'crazy days',
  'singles day', 'boxing day', 'back to school', "valentine's day",
  "mother's day", "father's day", 'christmas shopping', 'ramadan',
  'eid al-fitr', 'eid al-adha', 'diwali', 'seasonal sale', 'holiday sale',
  'deals week', 'mid-year sale', 'end of season', 'weekend deals',
  'promo', 'promotion',
];

const INCIDENT_TERMS = [
  'storm', 'flood', 'wildfire', 'fire', 'heatwave', 'blizzard', 'snowstorm',
  'earthquake', 'outage', 'blackout', 'power cut', 'strike', 'walkout',
  'protest', 'blockage', 'derailment', 'evacuation', 'shutdown', 'lockdown',
  'accident', 'disruption', 'warning', 'alert', 'emergency', 'delay',
  'closure', 'cancellation', 'severe weather',
];

const TREND_TERMS = [
  'rise of', 'shift to', 'shift toward', 'growing', 'growth in',
  'adoption of', 'preference for', 'move toward', 'becoming',
  'trending', 'on the rise', 'increasingly', 'long-term', 'secular',
  'changing habits', 'new normal', 'generational',
];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTHS_FI = [
  'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
  'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu',
];

function haystack(input: ClassifierInput): string {
  return [input.label, input.description, (input.keywords ?? []).join(' ')]
    .join(' ')
    .toLowerCase();
}

function matchCount(text: string, terms: readonly string[]): { hits: number; firstHit?: string } {
  let hits = 0;
  let firstHit: string | undefined;
  for (const term of terms) {
    if (text.includes(term)) {
      hits++;
      firstHit ??= term;
    }
  }
  return { hits, firstHit };
}

/**
 * Parse a 4-digit year in the near future window as a coarse eventStart hint.
 * Looks for patterns like "2026", "June 2026", "kesäkuu 2026".
 * Returns null if no plausible future year is found.
 */
function extractEventStart(text: string, now: Date): Date | undefined {
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (!yearMatch) return undefined;
  const year = Number(yearMatch[1]);
  if (!Number.isFinite(year)) return undefined;

  // Reject years far in the past or unreasonably far in the future.
  const thisYear = now.getUTCFullYear();
  if (year < thisYear - 1 || year > thisYear + 5) return undefined;

  // Try to find a month token (English or Finnish) within 30 chars of the year.
  const yearIndex = text.indexOf(yearMatch[1]);
  const window = text.slice(Math.max(0, yearIndex - 30), yearIndex + 30);
  let monthIndex = -1;
  for (let i = 0; i < MONTHS.length; i++) {
    if (window.includes(MONTHS[i]) || window.includes(MONTHS_FI[i])) {
      monthIndex = i;
      break;
    }
  }
  const month = monthIndex >= 0 ? monthIndex : 0;
  return new Date(Date.UTC(year, month, 1));
}

/**
 * Classify a phenomenon into TREND / EVENT / CAMPAIGN / INCIDENT with
 * keyword priors. The LLM fallback is optional; callers may override by
 * calling classifyWithLLM() (not implemented here — hook point for Phase 2b).
 */
export function classify(input: ClassifierInput, now: Date = new Date()): ClassifierResult {
  const text = haystack(input);
  const reasons: string[] = [];

  const incident = matchCount(text, INCIDENT_TERMS);
  const event = matchCount(text, EVENT_TERMS);
  const campaign = matchCount(text, CAMPAIGN_TERMS);
  const trend = matchCount(text, TREND_TERMS);

  // INCIDENT wins on explicit emergency language regardless of other terms.
  if (incident.hits > 0) {
    reasons.push(`incident term: "${incident.firstHit}"`);
    return {
      type: 'INCIDENT',
      confidence: Math.min(0.95, 0.6 + 0.1 * incident.hits),
      reasons,
    };
  }

  // CAMPAIGN and EVENT can overlap (a seasonal sale "event"). CAMPAIGN is
  // the more specific label when explicit campaign language is present.
  if (campaign.hits > 0) {
    reasons.push(`campaign term: "${campaign.firstHit}"`);
    const start = extractEventStart(text, now);
    if (start) reasons.push(`date hint: ${start.toISOString().slice(0, 10)}`);
    return {
      type: 'CAMPAIGN',
      eventStart: start,
      confidence: Math.min(0.9, 0.55 + 0.1 * campaign.hits),
      reasons,
    };
  }

  if (event.hits > 0) {
    reasons.push(`event term: "${event.firstHit}"`);
    const start = extractEventStart(text, now);
    if (start) reasons.push(`date hint: ${start.toISOString().slice(0, 10)}`);
    return {
      type: 'EVENT',
      eventStart: start,
      confidence: Math.min(0.9, 0.55 + 0.1 * event.hits),
      reasons,
    };
  }

  // TREND is the default when nothing event-like is detected, with a small
  // boost when explicit trend language is present.
  const base = trend.hits > 0 ? 0.75 : 0.5;
  if (trend.hits > 0) reasons.push(`trend term: "${trend.firstHit}"`);
  else reasons.push('no type-specific terms; defaulting to TREND');
  return {
    type: 'TREND',
    confidence: Math.min(0.9, base + 0.05 * trend.hits),
    reasons,
  };
}
