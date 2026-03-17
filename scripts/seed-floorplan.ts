/**
 * Seed script: restore Ideapark zones and stores from static data into the database.
 * Usage: npx tsx scripts/seed-floorplan.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { IDEAPARK_ZONES, IDEAPARK_UPPER_ZONES } from '../src/lib/data/ideaparkZones';
import { GROUND_FLOOR_STORES } from '../src/lib/data/ideaparkStorePositions';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://kimmoi@localhost:5432/stelthion',
});
const prisma = new PrismaClient({ adapter });

const MALL_ID = 'ideapark';

async function seedFloor(floor: string, zones: typeof IDEAPARK_ZONES) {
  // Delete existing data for this floor
  await prisma.floorplanStore.deleteMany({ where: { mallId: MALL_ID, floor } });
  await prisma.camera.deleteMany({ where: { mallId: MALL_ID, floor } });
  await prisma.floorplanZone.deleteMany({ where: { mallId: MALL_ID, floor } });

  // Insert zones
  for (const z of zones) {
    await prisma.floorplanZone.create({
      data: {
        mallId: MALL_ID,
        floor,
        zoneId: z.id,
        name: z.name,
        nameFi: z.nameFi,
        category: z.category,
        svgPoints: z.svgPoints,
        labelX: z.labelX,
        labelY: z.labelY,
        capacity: z.capacity,
        areaSqm: z.area_sqm,
        baseVisitors: z.baseVisitors,
      },
    });
  }

  console.log(`  ${floor}: ${zones.length} zones created`);
}

async function seedStores(floor: string, stores: typeof GROUND_FLOOR_STORES) {
  // Look up zone DB IDs
  const dbZones = await prisma.floorplanZone.findMany({
    where: { mallId: MALL_ID, floor },
    select: { id: true, zoneId: true },
  });
  const zoneMap = new Map(dbZones.map((z) => [z.zoneId, z.id]));

  let count = 0;
  for (const s of stores) {
    const zoneDbId = zoneMap.get(s.zoneId);
    if (!zoneDbId) {
      console.warn(`  Skipping store "${s.name}" — no zone "${s.zoneId}"`);
      continue;
    }
    await prisma.floorplanStore.create({
      data: {
        mallId: MALL_ID,
        floor,
        name: s.name,
        slug: s.slug,
        zoneDbId,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
      },
    });
    count++;
  }
  console.log(`  ${floor}: ${count} stores created`);
}

async function main() {
  console.log('Seeding Ideapark floorplan data...');

  await seedFloor('ground', IDEAPARK_ZONES);
  await seedFloor('upper', IDEAPARK_UPPER_ZONES);
  await seedStores('ground', GROUND_FLOOR_STORES);
  // No upper floor stores in static data yet

  console.log('Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
