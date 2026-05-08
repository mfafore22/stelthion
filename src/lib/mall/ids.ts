/**
 * Canonical mall-id helpers.
 *
 * One canonical id per mall: `{operator-slug}-{property-slug}` (e.g.
 * "ideapark-lempaala", "realidea-sello"). Every new mall must register
 * its canonical id here and use it everywhere; legacy short variants
 * fold back to the canonical form via LEGACY_ALIASES.
 */
import { MALLS } from './mallDatabase';

export const KNOWN_MALL_IDS = [
  'ideapark-lempaala',
  'realidea-sello',
  'realidea-tripla',
  'realidea-itis',
  'realidea-jumbo',
  'realidea-kamp-galleria',
  'realidea-karuselli',
  'realidea-plaza',
  'realidea-arabia',
  'realidea-columbus',
  'realidea-duo',
  'realidea-grani',
  'realidea-dixi',
  'realidea-entresse',
  'realidea-fresko',
  'realidea-kale',
  'realidea-kivis',
  'realidea-liila',
  'realidea-lansikeskus',
] as const;
export type KnownMallId = (typeof KNOWN_MALL_IDS)[number];

const LEGACY_ALIASES: Record<string, KnownMallId> = {
  ideapark: 'ideapark-lempaala',
  sello: 'realidea-sello',
  tripla: 'realidea-tripla',
  itis: 'realidea-itis',
  jumbo: 'realidea-jumbo',
  'kamp-galleria': 'realidea-kamp-galleria',
  karuselli: 'realidea-karuselli',
  plaza: 'realidea-plaza',
  arabia: 'realidea-arabia',
  columbus: 'realidea-columbus',
  duo: 'realidea-duo',
  grani: 'realidea-grani',
  dixi: 'realidea-dixi',
  entresse: 'realidea-entresse',
  fresko: 'realidea-fresko',
  kale: 'realidea-kale',
  kivis: 'realidea-kivis',
  liila: 'realidea-liila',
  lansikeskus: 'realidea-lansikeskus',
};

export function canonicalizeMallId(mallId: string | null | undefined): KnownMallId | null {
  if (!mallId) return null;
  if ((KNOWN_MALL_IDS as readonly string[]).includes(mallId)) return mallId as KnownMallId;
  if (LEGACY_ALIASES[mallId]) return LEGACY_ALIASES[mallId];
  return null;
}

export function isMallId(mallId: string | null | undefined, target: KnownMallId): boolean {
  return canonicalizeMallId(mallId) === target;
}

export function isKnownMallId(mallId: string | null | undefined): boolean {
  return canonicalizeMallId(mallId) !== null;
}

export function assertKnownMallId(mallId: string | null | undefined): KnownMallId {
  const canonical = canonicalizeMallId(mallId);
  if (!canonical) {
    throw new Error(
      `Unknown mallId "${mallId}". Register it in src/lib/mall/ids.ts (KNOWN_MALL_IDS) and src/lib/mall/mallDatabase.ts (MALLS).`,
    );
  }
  return canonical;
}

for (const id of KNOWN_MALL_IDS) {
  if (!MALLS[id]) {
    console.warn(`[mall/ids] KNOWN_MALL_IDS contains "${id}" but MALLS has no entry for it.`);
  }
}
