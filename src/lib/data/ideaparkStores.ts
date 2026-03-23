/**
 * Ideapark Lempäälä — Store data types and zone-mapping helpers.
 *
 * Raw data comes from https://lempaala.ideapark.fi?infotaulu=1 — the same
 * endpoint the Wayfinder2D floor map uses. Each store has an `om_location`
 * field in "wing.unit" format (e.g. "8.05"). The integer prefix is the wing
 * number; we map that to our 9 zone IDs via IDEAPARK_ZONES.locationPrefixes.
 */

import { IDEAPARK_ZONES } from './ideaparkZones';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdeaparkStore {
  id: number;
  slug: string;
  name: string;
  /** Finnish category name, e.g. "Kahvilat & ravintolat" */
  category: string;
  tags: string[];
  /** Raw om_location code from the CMS, e.g. "8.05" or "20.66b" */
  locationCode: string;
  /** Zone ID from IDEAPARK_ZONES, e.g. "central-hub". Null if unmatched. */
  zoneId: string | null;
  /** Finnish zone display name, e.g. "Ravintolamaailma" */
  zoneName: string | null;
  phone: string;
  email: string;
  /** Store page URL on lempaala.ideapark.fi */
  url: string;
}

/** Shape of one entry returned by lempaala.ideapark.fi?infotaulu=1 */
interface RawInfotauluEntry {
  ID: number;
  title: string;
  url: string;
  tags: Record<string, string>;
  categories: Record<string, string>;
  om_phone?: string;
  om_email?: string;
  om_location?: { om_location?: string };
}

// ─── Zone prefix lookup (built once at module load) ───────────────────────────

/** Maps each om_location integer prefix → zone id + Finnish name */
const PREFIX_TO_ZONE = new Map<number, { zoneId: string; zoneName: string }>();

for (const zone of IDEAPARK_ZONES) {
  for (const prefix of zone.locationPrefixes) {
    PREFIX_TO_ZONE.set(prefix, { zoneId: zone.id, zoneName: zone.nameFi });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decode common HTML entities returned by the WordPress CMS */
function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Parse the integer prefix from an om_location code.
 * "8.05" → 8,  "20.66b" → 20,  "A1.14" → null,  "xxx" → null
 */
function parseLocationPrefix(code: string): number | null {
  const match = code.match(/^(\d+)\./);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Extract a slug from a store URL.
 * "https://lempaala.ideapark.fi/shop/burgerking/" → "burgerking"
 */
function slugFromUrl(url: string): string {
  return url.replace(/\/$/, '').split('/').pop() ?? '';
}

/**
 * Normalise a raw infotaulu entry into an IdeaparkStore.
 */
export function normaliseStore(raw: RawInfotauluEntry): IdeaparkStore {
  const locationCode = raw.om_location?.om_location?.trim() ?? '';
  const prefix = locationCode ? parseLocationPrefix(locationCode) : null;
  const zone = prefix !== null ? (PREFIX_TO_ZONE.get(prefix) ?? null) : null;

  return {
    id: raw.ID,
    slug: slugFromUrl(raw.url ?? ''),
    name: decodeHtml(raw.title),
    category: decodeHtml(Object.values(raw.categories ?? {})[0] ?? ''),
    tags: Object.values(raw.tags ?? {}).map(decodeHtml),
    locationCode,
    zoneId: zone?.zoneId ?? null,
    zoneName: zone?.zoneName ?? null,
    phone: raw.om_phone ?? '',
    email: raw.om_email ?? '',
    url: raw.url ?? '',
  };
}

/**
 * Parse the full infotaulu JSON response (object or array) into stores.
 */
export function parseInfotauluResponse(data: unknown): IdeaparkStore[] {
  if (!data || typeof data !== 'object') return [];

  const entries: RawInfotauluEntry[] = Array.isArray(data)
    ? (data as RawInfotauluEntry[])
    : (Object.values(data) as RawInfotauluEntry[]);

  return entries
    .filter((e) => e && typeof e === 'object' && e.ID && e.title)
    .map(normaliseStore);
}
