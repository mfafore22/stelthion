/**
 * Seed script: restore Ideapark zones from static data into the database.
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
  // Delete existing data for this floor (cameras first for FK safety)
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

/** Convert legacy store positions into zone records with drawShape: 'rect' */
async function seedStoresAsZones(floor: string, stores: typeof GROUND_FLOOR_STORES) {
  let count = 0;
  for (const s of stores) {
    // Convert rect (x, y, w, h) to 4-point polygon
    const x2 = s.x + s.w;
    const y2 = s.y + s.h;
    const svgPoints = `${s.x},${s.y} ${x2},${s.y} ${x2},${y2} ${s.x},${y2}`;

    await prisma.floorplanZone.create({
      data: {
        mallId: MALL_ID,
        floor,
        zoneId: `store-${s.slug}`,
        name: s.name,
        nameFi: s.name,
        category: 'Store',
        drawShape: 'rect',
        svgPoints,
        labelX: s.x + s.w / 2,
        labelY: s.y + s.h / 2,
        capacity: 0,
        areaSqm: 0,
        baseVisitors: 0,
      },
    });
    count++;
  }
  console.log(`  ${floor}: ${count} stores seeded as zones (drawShape: rect)`);
}

async function main() {
  console.log('Seeding Ideapark floorplan data...');

  await seedFloor('ground', IDEAPARK_ZONES);
  await seedFloor('upper', IDEAPARK_UPPER_ZONES);
  await seedStoresAsZones('ground', GROUND_FLOOR_STORES);

  console.log('Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
