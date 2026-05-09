// Materialises the four non-FI target markets from seed-markets.json into
// the ShopperMind DB so country-level trend differentiation becomes visible
// in the UI. Idempotent: re-running upserts in place.
//
// Targets: stockholm-se, london-uk, newyork-us, dubai-ae
//
// Usage (from services/shoppermind/):
//   DATABASE_URL=... REDIS_URL=... SHOPPERMIND_SERVICE_TOKEN=... \
//   SHOPPERMIND_INTERNAL_TOKEN=... npx tsx scripts/seed-multi-country-markets.ts

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma as prismaFactory } from '../src/db/prisma.js';

const TARGETS = new Set(['stockholm-se', 'london-uk', 'newyork-us', 'dubai-ae']);
const SEED_PATH = resolve(
  new URL('../src/engine/registry/seed-markets.json', import.meta.url).pathname,
);

interface SeedMarket {
  id: string;
  country: string;
  region: string | null;
  displayName: string;
  industryFocus: string;
  geoAnchorLat?: number | null;
  geoAnchorLon?: number | null;
  footTrafficSubs?: string[];
  culturalSubs?: string[];
  footTrafficAxisWeight?: number;
  culturalAxisWeight?: number;
  active?: boolean;
  profile?: unknown;
  policy?: unknown;
}

const prisma = prismaFactory();

async function main() {
  const raw = await readFile(SEED_PATH, 'utf8');
  const all = JSON.parse(raw) as SeedMarket[];
  const targets = all.filter((market) => TARGETS.has(market.id));
  if (targets.length !== TARGETS.size) {
    const missing = [...TARGETS].filter((id) => !targets.find((m) => m.id === id));
    throw new Error(`Missing market entries in seed-markets.json: ${missing.join(', ')}`);
  }

  for (const market of targets) {
    const data = {
      country: market.country,
      region: market.region,
      displayName: market.displayName,
      industryFocus: market.industryFocus,
      geoAnchorLat: market.geoAnchorLat ?? null,
      geoAnchorLon: market.geoAnchorLon ?? null,
      footTrafficSubs: market.footTrafficSubs ?? [],
      culturalSubs: market.culturalSubs ?? [],
      footTrafficAxisWeight: market.footTrafficAxisWeight ?? 0.5,
      culturalAxisWeight: market.culturalAxisWeight ?? 0.5,
      active: market.active ?? true,
      profile: (market.profile ?? {}) as object,
      policy: (market.policy ?? {}) as object,
    };
    const result = await prisma.market.upsert({
      where: { id: market.id },
      create: { id: market.id, ...data },
      update: data,
    });
    console.log(`+ market ${result.id} (${result.country})`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
