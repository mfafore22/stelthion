/**
 * Registers a starter set of real public RSS sources for the helsinki-fi market.
 *
 * Usage (from services/shoppermind/):
 *   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
 *   REDIS_URL=redis://localhost:56379 \
 *   SHOPPERMIND_SERVICE_TOKEN=dev-local-token-0000 \
 *   SHOPPERMIND_INTERNAL_TOKEN=dev-internal-token-0000 \
 *   npx tsx scripts/seed-sources-helsinki.ts
 */

import { prisma as prismaFactory } from '../src/db/prisma.js';

const prisma = prismaFactory();

const MARKET_ID = 'helsinki-fi';
const COUNTRY = 'FI';
const LANGUAGE = 'fi';

const SOURCES = [
  {
    name: 'Yle Uutiset: pääuutiset',
    url: 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss',
    weight: 1.0,
  },
  {
    name: 'Yle Uutiset: kaikki',
    url: 'https://yle.fi/uutiset/rss/uutiset.rss',
    weight: 0.8,
  },
  {
    name: 'Helsingin Sanomat: tuoreimmat',
    url: 'https://www.hs.fi/rss/tuoreimmat.xml',
    weight: 1.0,
  },
  {
    name: 'Ilta-Sanomat: tuoreimmat',
    url: 'https://www.is.fi/rss/tuoreimmat.xml',
    weight: 0.7,
  },
];

async function main() {
  const market = await prisma.market.findUnique({ where: { id: MARKET_ID } });
  if (!market) {
    throw new Error(`Market ${MARKET_ID} not found — run seed-demo.ts first`);
  }

  for (const s of SOURCES) {
    const existing = await prisma.signalSource.findFirst({
      where: { marketId: MARKET_ID, url: s.url },
    });
    if (existing) {
      await prisma.signalSource.update({
        where: { id: existing.id },
        data: { name: s.name, weight: s.weight, active: true, nextFetchAt: new Date() },
      });
      console.log(`  ↻ Updated: ${s.name}`);
    } else {
      await prisma.signalSource.create({
        data: {
          name: s.name,
          type: 'RSS',
          url: s.url,
          country: COUNTRY,
          language: LANGUAGE,
          weight: s.weight,
          active: true,
          marketId: MARKET_ID,
          nextFetchAt: new Date(),
        },
      });
      console.log(`  + Created: ${s.name}`);
    }
  }

  console.log('\n✅ Helsinki sources registered.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
