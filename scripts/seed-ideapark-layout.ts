/**
 * Seed script: restore Ideapark admin-drawn zones + cameras/counters.
 *
 * This is the authoritative layout extracted from the C1 local database.
 * It contains the correct zones (hallways, entrances, anchors, restaurants,
 * stairs, entertainment) and all camera/counter devices placed by the admin.
 *
 * DESTRUCTIVE for zones + cameras: clears all existing FloorplanZone and
 * Camera rows for mallId 'ideapark' before re-creating from this file.
 * Counter readings (CounterReading / CounterUpload) are NOT touched.
 *
 * Usage:
 *   DATABASE_URL=<...> npx tsx scripts/seed-ideapark-layout.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('On the server, run: DATABASE_URL="<connection-string>" npx tsx scripts/seed-ideapark-layout.ts');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

const MALL_ID = 'ideapark';

// ── Zones (admin-drawn, extracted from C1 DB) ─────────────────────────────────

const ZONES = [
  // ── Ground floor ──────────────────────────────────────────────────────────
  { floor: 'ground', zoneId: 'zone-1774543426291', name: 'Citymarket',              nameFi: 'Citymarket',              category: 'Anchor',        drawShape: 'polygon', svgPoints: '121,113 163,113 163,395 92,395 72,377 72,142 120,142',                                                                                                                                                          labelX: 115,  labelY: 240, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774544027605', name: 'D-Aula rullaportaat',     nameFi: 'D-Aula rullaportaat',     category: 'Stairs',        drawShape: 'rect',    svgPoints: '223,406 270,406 270,413 223,413',                                                                                                                                                                                labelX: 247,  labelY: 410, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774544635362', name: 'PRISMA',                  nameFi: 'PRISMA',                  category: 'Anchor',        drawShape: 'polygon', svgPoints: '164,114 205,114 205,142 275,142 275,151 295,151 295,314 248,314 248,382 196,394 164,394',                                                                                                                       labelX: 234,  labelY: 237, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774544722166', name: 'Bläk Boks',               nameFi: 'Bläk Boks',               category: 'Entertainment', drawShape: 'polygon', svgPoints: '470,138 491,138 491,115 620,115 620,225 593,225 593,335 553,335 553,329 576,301 561,295 537,320 523,320 523,297 489,297 489,247 470,247 470,199 488,199 488,163 470,163',                                      labelX: 527,  labelY: 238, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774546877944', name: 'Sisäänkäynti C',          nameFi: 'Sisäänkäynti C',          category: 'Entrance',      drawShape: 'rect',    svgPoints: '455,584 468,584 468,609 455,609',                                                                                                                                                                                labelX: 462,  labelY: 597, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774547032404', name: 'Sisäänkäynti B',          nameFi: 'Sisäänkäynti B',          category: 'Entrance',      drawShape: 'rect',    svgPoints: '774,584 785,584 785,609 774,609',                                                                                                                                                                                labelX: 780,  labelY: 597, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774547096212', name: 'Sisäänkäynti A',          nameFi: 'Sisäänkäynti A',          category: 'Entrance',      drawShape: 'rect',    svgPoints: '1080,394 1090,394 1090,434 1080,434',                                                                                                                                                                            labelX: 1085, labelY: 414, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774547192872', name: 'Sisäänkäynti D',          nameFi: 'Sisäänkäynti D',          category: 'Entrance',      drawShape: 'rect',    svgPoints: '163,395 173,395 173,432 163,432',                                                                                                                                                                                labelX: 168,  labelY: 414, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774705799795', name: 'Vesimaailma Louhi',       nameFi: 'Vesimaailma Louhi',       category: 'Store',         drawShape: 'rect',    svgPoints: '1125,392 1175,392 1175,404 1125,404',                                                                                                                                                                            labelX: 1150, labelY: 398, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774709899505', name: 'Citymarket Nouto',        nameFi: 'Citymarket Nouto',        category: 'Store',         drawShape: 'rect',    svgPoints: '71,379 88,379 88,394 71,394',                                                                                                                                                                                    labelX: 80,   labelY: 387, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968023936', name: 'Ravintolamaailma',        nameFi: 'Ravintolamaailma',        category: 'Restaurant',    drawShape: 'rect',    svgPoints: '552,334 692,334 692,427 552,427',                                                                                                                                                                                labelX: 622,  labelY: 381, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968060888', name: 'Rullaportaat A',          nameFi: 'Rullaportaat A',          category: 'Stairs',        drawShape: 'rect',    svgPoints: '973,405 1021,405 1021,415 973,415',                                                                                                                                                                              labelX: 997,  labelY: 410, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968137552', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '770,372 955,372 955,390 770,390',                                                                                                                                                                                labelX: 863,  labelY: 381, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968177822', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '821,498 831,515 979,441 968,423 960,431',                                                                                                                                                                        labelX: 912,  labelY: 462, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968229269', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '702,498 766,498 766,515 702,515',                                                                                                                                                                                labelX: 734,  labelY: 507, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968255969', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '483,499 540,499 540,514 483,514',                                                                                                                                                                                labelX: 512,  labelY: 507, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968274987', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '541,500 702,500 702,515 541,515',                                                                                                                                                                                labelX: 622,  labelY: 508, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968316184', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '434,498 427,515 414,515 249,434 278,427 420,500',                                                                                                                                                                labelX: 370,  labelY: 482, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968360051', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '286,392 250,381 282,372 469,372 475,392',                                                                                                                                                                        labelX: 352,  labelY: 382, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968410519', name: 'Bubbles',                 nameFi: 'Bubbles',                 category: 'Restaurant',    drawShape: 'rect',    svgPoints: '512,322 550,322 550,371 512,371',                                                                                                                                                                                labelX: 531,  labelY: 347, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968542682', name: 'Ståhlberg Cafe',          nameFi: 'Ståhlberg Cafe',          category: 'Restaurant',    drawShape: 'rect',    svgPoints: '483,392 538,392 538,431 483,431',                                                                                                                                                                                labelX: 511,  labelY: 412, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968573283', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '484,372 538,372 538,391 484,391',                                                                                                                                                                                labelX: 511,  labelY: 382, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968597571', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '538,431 555,431 555,489 538,489',                                                                                                                                                                                labelX: 547,  labelY: 460, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968623718', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '686,429 703,429 703,487 686,487',                                                                                                                                                                                labelX: 695,  labelY: 458, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968660683', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '429,516 435,501 481,501 481,518 468,545 456,545',                                                                                                                                                                labelX: 458,  labelY: 521, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968700583', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '774,545 761,521 768,521 768,500 817,500 827,517 816,517 786,545',                                                                                                                                                labelX: 790,  labelY: 521, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968754336', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '475,393 482,393 482,498 475,498',                                                                                                                                                                                labelX: 479,  labelY: 446, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968792999', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'rect',    svgPoints: '557,428 685,428 685,440 557,440',                                                                                                                                                                                labelX: 621,  labelY: 434, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968830484', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '693,371 760,371 760,392 732,392 732,418 694,418',                                                                                                                                                                labelX: 729,  labelY: 394, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968890802', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '1078,376 1078,392 1058,404 1035,404 1035,392 1053,392',                                                                                                                                                          labelX: 1056, labelY: 393, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968913832', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '973,373 1031,391 1031,403 972,386',                                                                                                                                                                              labelX: 1002, labelY: 388, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968947018', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '1035,420 1075,420 1075,432 1035,432',                                                                                                                                                                            labelX: 1055, labelY: 426, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774968976818', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '1032,420 1005,420 994,420 982,439 993,432 1032,432',                                                                                                                                                              labelX: 1006, labelY: 427, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774969086051', name: 'Citymarket sisäänkäynti', nameFi: 'Citymarket sisäänkäynti', category: 'Anchor',        drawShape: 'rect',    svgPoints: '97,395 154,395 154,405 97,405',                                                                                                                                                                                  labelX: 126,  labelY: 400, capacity: 0,    areaSqm: 0,   baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774969185450', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '177,395 199,395 247,382 247,392 198,405 177,405',                                                                                                                                                                labelX: 208,  labelY: 396, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  { floor: 'ground', zoneId: 'zone-1774969213119', name: 'Käytävä',                 nameFi: 'Käytävä',                 category: 'Hallway',       drawShape: 'polygon', svgPoints: '177,432 246,432 246,425 177,425',                                                                                                                                                                                labelX: 212,  labelY: 429, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: true  },
  // ── Upper floor ───────────────────────────────────────────────────────────
  { floor: 'upper',  zoneId: 'zone-1774967940495', name: 'Viihdekeskus',            nameFi: 'Viihdekeskus',            category: 'Entertainment', drawShape: 'polygon', svgPoints: '87,346 209,346 463,471 480,471 521,515 521,599 486,599 370,570 243,522 138,470 85,437',                                                                                                                         labelX: 328,  labelY: 486, capacity: 1000, areaSqm: 500, baseVisitors: 0, published: false },
];

// ── Cameras & counters (admin-placed, extracted from C1 DB) ──────────────────

const CAMERAS = [
  // Ground floor — counters (Asiakasovet / visitor counting devices)
  { floor: 'ground', label: 'AL22 CityMarket Pääsisäänkäynti (Asiakasovet)',        x: 114,  y: 394, deviceType: 'counter' },
  { floor: 'ground', label: 'AL23 CityMarket Nouto-ovi (Asiakasovet)',              x: 76,   y: 379, deviceType: 'counter' },
  { floor: 'ground', label: 'Laskuri D',                                            x: 161,  y: 397, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.10 (Asiakasovet)',                     x: 1136, y: 110, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.20 (Louhi Vesimaailma) (Asiakasovet)', x: 1169, y: 399, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.30 (Asiakasovet)',                     x: 468,  y: 123, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.30 (Asiakasovet)',                     x: 686,  y: 125, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.30 (Asiakasovet)',                     x: 877,  y: 131, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.50 (Asiakasovet)',                     x: 102,  y: 127, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti 12.50.2 (Asiakasovet)',                   x: 212,  y: 117, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti A (Asiakasovet)',                         x: 1084, y: 431, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti B (Asiakasovet)',                         x: 769,  y: 606, deviceType: 'counter' },
  { floor: 'ground', label: 'Sisäänkäynti C (Asiakasovet)',                         x: 474,  y: 607, deviceType: 'counter' },
  // Ground floor — cameras
  { floor: 'ground', label: 'Citymarket 360',       x: 88,  y: 393, deviceType: 'camera' },
  { floor: 'ground', label: 'D-Aula 360',           x: 276, y: 410, deviceType: 'camera' },
  { floor: 'ground', label: 'D-Aula1',              x: 198, y: 404, deviceType: 'camera' },
  { floor: 'ground', label: 'D-Aula2',              x: 198, y: 423, deviceType: 'camera' },
  { floor: 'ground', label: 'D-sisäänkäynti Ulko360', x: 191, y: 519, deviceType: 'camera' },
  // Upper floor — counters (2. kerroksen laskurit)
  { floor: 'upper',  label: '2. kerros A-pääty (2. kerroksen laskurit)',    x: 273,  y: 303, deviceType: 'counter' },
  { floor: 'upper',  label: '2. kerros B-keskiosa (2. kerroksen laskurit)', x: 972,  y: 429, deviceType: 'counter' },
  { floor: 'upper',  label: '2. kerros C-keskiosa (2. kerroksen laskurit)', x: 553,  y: 426, deviceType: 'counter' },
  { floor: 'upper',  label: '2. kerros D-pääty (2. kerroksen laskurit)',    x: 1288, y: 300, deviceType: 'counter' },
];

async function main() {
  // Verify mall exists
  const mall = await prisma.mall.findUnique({ where: { mallId: MALL_ID } });
  if (!mall) {
    console.error(`Mall '${MALL_ID}' not found. Run prisma/seed.ts first.`);
    process.exit(1);
  }

  console.log(`Seeding Ideapark layout for mallId='${MALL_ID}'...`);

  // ── Clear existing data ────────────────────────────────────────────────────
  const deletedCameras = await prisma.camera.deleteMany({ where: { mallId: MALL_ID } });
  const deletedZones   = await prisma.floorplanZone.deleteMany({ where: { mallId: MALL_ID } });
  console.log(`  Cleared ${deletedZones.count} zones, ${deletedCameras.count} cameras`);

  // ── Seed zones ─────────────────────────────────────────────────────────────
  for (const z of ZONES) {
    await prisma.floorplanZone.create({
      data: {
        mallId:       MALL_ID,
        floor:        z.floor,
        zoneId:       z.zoneId,
        name:         z.name,
        nameFi:       z.nameFi,
        category:     z.category,
        drawShape:    z.drawShape,
        svgPoints:    z.svgPoints,
        labelX:       z.labelX,
        labelY:       z.labelY,
        capacity:     z.capacity,
        areaSqm:      z.areaSqm,
        baseVisitors: z.baseVisitors,
        publishedAt:  z.published ? new Date() : null,
      },
    });
  }
  console.log(`  Created ${ZONES.length} zones`);

  // ── Seed cameras & counters ────────────────────────────────────────────────
  for (const c of CAMERAS) {
    await prisma.camera.create({
      data: {
        mallId:     MALL_ID,
        floor:      c.floor,
        label:      c.label,
        x:          c.x,
        y:          c.y,
        deviceType: c.deviceType,
        active:     true,
      },
    });
  }
  const cameraCount = CAMERAS.filter(c => c.deviceType === 'camera').length;
  const counterCount = CAMERAS.filter(c => c.deviceType === 'counter').length;
  console.log(`  Created ${cameraCount} cameras, ${counterCount} counters`);

  console.log('Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
