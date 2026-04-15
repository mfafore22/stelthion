/**
 * Seed ShopperMind signal sources from MARKET_PROFILE.
 * Idempotent: upserts on (name) — safe to re-run.
 * Usage: npx tsx scripts/shoppermind/seed-sources.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MARKET_PROFILE } from '../../src/services/shoppermind/markets';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://kimmoi@localhost:5432/stelthion',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  let upserted = 0;
  for (const market of Object.values(MARKET_PROFILE)) {
    for (const seed of market.seedSources) {
      const existing = await prisma.signalSource.findFirst({
        where: { name: seed.name, country: market.country },
      });
      const data = {
        name: seed.name,
        type: seed.type,
        url: seed.url,
        country: market.country,
        language: seed.language,
        weight: seed.weight ?? 1.0,
        active: true,
        config: seed.config ? JSON.parse(JSON.stringify(seed.config)) : undefined,
      };
      if (existing) {
        await prisma.signalSource.update({ where: { id: existing.id }, data: data as Parameters<typeof prisma.signalSource.update>[0]['data'] });
      } else {
        await prisma.signalSource.create({ data: data as Parameters<typeof prisma.signalSource.create>[0]['data'] });
      }
      upserted++;
    }
  }
  console.log(`Upserted ${upserted} signal sources across ${Object.keys(MARKET_PROFILE).length} markets.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
