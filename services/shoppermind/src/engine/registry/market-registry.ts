import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../db/prisma.js';
import { MarketSchema, type MarketConfig } from './market-schema.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = resolve(HERE, 'seed-markets.json');

type CacheEntry = { at: number; market: MarketConfig };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

let seedCache: MarketConfig[] | null = null;

async function loadSeed(): Promise<MarketConfig[]> {
  if (seedCache) return seedCache;
  const raw = await readFile(SEED_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const markets = (Array.isArray(parsed) ? parsed : []).map((m) => MarketSchema.parse(m));
  seedCache = markets;
  return markets;
}

function fresh(entry: CacheEntry | undefined): boolean {
  return !!entry && Date.now() - entry.at < CACHE_TTL_MS;
}

function rowToMarket(row: {
  id: string;
  country: string;
  region: string | null;
  displayName: string;
  industryFocus: string;
  geoAnchorLat: number | null;
  geoAnchorLon: number | null;
  footTrafficSubs: string[];
  culturalSubs: string[];
  footTrafficAxisWeight: number;
  culturalAxisWeight: number;
  profile: unknown;
  policy: unknown;
  active: boolean;
}): MarketConfig {
  return MarketSchema.parse({
    id: row.id,
    country: row.country,
    region: row.region,
    displayName: row.displayName,
    industryFocus: row.industryFocus,
    geoAnchorLat: row.geoAnchorLat,
    geoAnchorLon: row.geoAnchorLon,
    footTrafficSubs: row.footTrafficSubs,
    culturalSubs: row.culturalSubs,
    footTrafficAxisWeight: row.footTrafficAxisWeight,
    culturalAxisWeight: row.culturalAxisWeight,
    profile: row.profile,
    policy: row.policy,
    active: row.active,
  });
}

export async function loadMarket(id: string): Promise<MarketConfig | null> {
  const cached = CACHE.get(id);
  if (fresh(cached)) return cached!.market;

  const row = await prisma().market.findUnique({ where: { id } });
  if (row) {
    const market = rowToMarket(row);
    CACHE.set(id, { at: Date.now(), market });
    return market;
  }

  const seed = await loadSeed();
  const match = seed.find((m) => m.id === id);
  if (match) {
    CACHE.set(id, { at: Date.now(), market: match });
    return match;
  }
  return null;
}

export async function listMarkets(): Promise<MarketConfig[]> {
  const rows = await prisma().market.findMany({ where: { active: true } });
  if (rows.length > 0) {
    return rows.map(rowToMarket);
  }
  return loadSeed();
}

export function invalidateMarketCache(id?: string): void {
  if (id) {
    CACHE.delete(id);
  } else {
    CACHE.clear();
  }
}
