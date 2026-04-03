/**
 * Seed script: restore Ideapark zones from static data into the database.
 * Performs a clean wipe of existing zones before seeding.
 * Usage: npx tsx scripts/seed-floorplan.ts
 */
import 'dotenv/config';// Ensure .env is loaded for DB connection
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { IDEAPARK_ZONES, IDEAPARK_UPPER_ZONES } from '../src/lib/data/ideaparkZones';
import { GROUND_FLOOR_STORES } from '../src/lib/data/ideaparkStorePositions';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

const MALL_ID = 'ideapark';

async function seedFloor(floor: string, zones: typeof IDEAPARK_ZONES) {
  let created = 0;
  let updated = 0;

  for (const z of zones) {
    const result = await prisma.floorplanZone.upsert({
      where: {
        mallId_floor_zoneId: { mallId: MALL_ID, floor, zoneId: z.id },
      },
      create: {
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
        publishedAt: new Date(),
      },
      update: {
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
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`  ${floor}: ${created} zones created, ${updated} updated (${zones.length} total)`);
}

async function seedStoresAsZones(floor: string, stores: typeof GROUND_FLOOR_STORES) {
  let created = 0;
  let updated = 0;

  for (const s of stores) {
    const x2 = s.x + s.w;
    const y2 = s.y + s.h;
    const svgPoints = `${s.x},${s.y} ${x2},${s.y} ${x2},${y2} ${s.x},${y2}`;
    const zoneId = `store-${s.slug}`;

    const result = await prisma.floorplanZone.upsert({
      where: {
        mallId_floor_zoneId: { mallId: MALL_ID, floor, zoneId },
      },
      create: {
        mallId: MALL_ID,
        floor,
        zoneId,
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
        publishedAt: new Date(),
      },
      update: {
        name: s.name,
        svgPoints,
        labelX: s.x + s.w / 2,
        labelY: s.y + s.h / 2,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }
  console.log(`  ${floor}: ${created} stores created, ${updated} updated (${stores.length} total)`);
}

async function main() {
  // Clean wipe — remove all existing zones to eliminate admin-drawn duplicates
  const deleted = await prisma.floorplanZone.deleteMany({ where: { mallId: MALL_ID } });
  console.log(`  Deleted ${deleted.count} existing zones (clean slate)`);

  // Safety check: warn if cameras exist (they won't be touched)
  const cameraCount = await prisma.camera.count({ where: { mallId: MALL_ID } });
  if (cameraCount > 0) {
    console.log(`  ⚠ ${cameraCount} cameras exist and will NOT be modified.`);
  }

  console.log('Seeding Ideapark floorplan data...');

  await seedFloor('ground', IDEAPARK_ZONES);
  await seedFloor('upper', IDEAPARK_UPPER_ZONES);
  //await seedStoresAsZones('ground', GROUND_FLOOR_STORES);

  console.log('Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });