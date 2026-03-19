import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const MALL_ID = 'ideapark' // must match Mall.mallId (semantic slug)

// Inline zone data (from ideaparkZones.ts) to avoid TS import issues in seed
const GROUND_ZONES = [
  { zoneId: 'west-anchor', name: 'West Anchor', nameFi: 'Läntinen ankkuri', category: 'Anchor', areaSqm: 15000, svgPoints: '52,110 215,110 215,355 52,355', capacity: 7500, labelX: 133, labelY: 232 },
  { zoneId: 'west-gallery', name: 'West Gallery', nameFi: 'Läntinen galleria', category: 'Fashion', areaSqm: 7000, svgPoints: '215,110 432,110 432,355 215,355', capacity: 3500, labelX: 323, labelY: 232 },
  { zoneId: 'center-gallery', name: 'Central Gallery', nameFi: 'Keskusgalleria', category: 'Fashion', areaSqm: 8000, svgPoints: '432,90 750,90 750,355 432,355', capacity: 4000, labelX: 591, labelY: 222 },
  { zoneId: 'east-gallery', name: 'East Gallery', nameFi: 'Itäinen galleria', category: 'Fashion', areaSqm: 7000, svgPoints: '750,90 1008,90 1008,355 750,355', capacity: 3500, labelX: 879, labelY: 222 },
  { zoneId: 'east-anchor', name: 'East Anchor', nameFi: 'Itäinen ankkuri', category: 'Anchor', areaSqm: 10000, svgPoints: '974,114 1078,114 1078,371 974,371', capacity: 5000, labelX: 1026, labelY: 243 },
  { zoneId: 'autoareena', name: 'Ideapark Autoareena', nameFi: 'Ideapark Autoareena', category: 'Auto', areaSqm: 14000, svgPoints: '1078,115 1379,115 1379,155 1209,393 1078,393', capacity: 2000, labelX: 1230, labelY: 250 },
  { zoneId: 'east-strip', name: 'East Strip', nameFi: 'Itäinen kaistale', category: 'Fashion', areaSqm: 4500, svgPoints: '960,280 1200,280 1200,430 960,430', capacity: 2250, labelX: 1080, labelY: 355 },
  { zoneId: 'west-arc', name: 'West Concourse', nameFi: 'Läntinen käytävä', category: 'Fashion', areaSqm: 9000, svgPoints: '52,355 430,355 430,583 400,570 300,517 200,445 105,390 52,355', capacity: 4500, labelX: 240, labelY: 475 },
  { zoneId: 'center-hub', name: 'Event Square', nameFi: 'Tapahtumatori', category: 'Mixed', areaSqm: 5500, svgPoints: '430,355 820,355 820,440 430,440', capacity: 2750, labelX: 640, labelY: 458 },
  { zoneId: 'food-court', name: 'Food Court', nameFi: 'Ravintolamaailma', category: 'F&B', areaSqm: 6500, svgPoints: '295,355 430,355 430,440 820,440 820,603 700,621 645,625 500,606 430,583 295,500', capacity: 3250, labelX: 555, labelY: 415 },
  { zoneId: 'east-arc', name: 'East Concourse', nameFi: 'Itäinen käytävä', category: 'Mixed', areaSqm: 9000, svgPoints: '820,355 1185,355 1100,437 1000,511 900,566 820,603', capacity: 4500, labelX: 1000, labelY: 472 },
]

const UPPER_ZONES = [
  { zoneId: 'upper-gallery', name: 'Upper Gallery', nameFi: 'Yläkerta galleria', category: 'Fashion', areaSqm: 8000, svgPoints: '120,168 1400,168 1400,280 120,280', capacity: 4000, labelX: 760, labelY: 224 },
  { zoneId: 'upper-west-wing', name: 'Upper West Wing', nameFi: 'Läntinen siipi', category: 'Leisure', areaSqm: 12000, svgPoints: '120,285 355,285 355,510 120,510', capacity: 3000, labelX: 237, labelY: 397 },
  { zoneId: 'upper-west-corridor', name: 'Upper West Corridor', nameFi: 'Läntinen käytävä', category: 'Fashion', areaSqm: 5000, svgPoints: '360,285 560,285 560,480 360,480', capacity: 2500, labelX: 460, labelY: 382 },
  { zoneId: 'upper-central', name: 'Upper Central', nameFi: 'Keskusaukio', category: 'Mixed', areaSqm: 5500, svgPoints: '565,285 955,285 955,480 565,480', capacity: 2750, labelX: 760, labelY: 382 },
  { zoneId: 'upper-east-corridor', name: 'Upper East Corridor', nameFi: 'Itäinen käytävä', category: 'Fashion', areaSqm: 5000, svgPoints: '960,285 1160,285 1160,480 960,480', capacity: 2500, labelX: 1060, labelY: 382 },
  { zoneId: 'upper-east-wing', name: 'Upper East Wing', nameFi: 'Itäinen siipi', category: 'Leisure', areaSqm: 12000, svgPoints: '1165,285 1400,285 1400,510 1165,510', capacity: 3000, labelX: 1282, labelY: 397 },
  { zoneId: 'upper-south-arc', name: 'Upper South Arc', nameFi: 'Eteläinen kaari', category: 'F&B', areaSqm: 4500, svgPoints: '360,510 1160,510 1060,545 960,570 860,585 760,590 660,585 560,570 460,545 360,510', capacity: 2250, labelX: 760, labelY: 555 },
]

const GROUND_STORES = [
  { name: 'Citymarket', slug: 'citymarket', zoneId: 'west-anchor', x: 52, y: 110, w: 163, h: 245 },
  { name: 'Prisma Ideapark', slug: 'prisma-ideapark', zoneId: 'west-gallery', x: 215, y: 110, w: 217, h: 145 },
  { name: 'Budget Sport', slug: 'budget-sport', zoneId: 'west-gallery', x: 215, y: 255, w: 217, h: 100 },
  { name: 'Bläk Boks', slug: 'blak-boks', zoneId: 'center-gallery', x: 432, y: 90, w: 190, h: 265 },
  { name: 'Halonen', slug: 'halonen', zoneId: 'center-gallery', x: 622, y: 110, w: 130, h: 245 },
  { name: 'Clas Ohlson', slug: 'clas-ohlson', zoneId: 'east-gallery', x: 700, y: 90, w: 120, h: 75 },
  { name: 'FIDA Second Hand', slug: 'fida-second-hand', zoneId: 'east-gallery', x: 820, y: 165, w: 140, h: 95 },
  { name: 'JYSK', slug: 'jysk', zoneId: 'east-gallery', x: 752, y: 260, w: 206, h: 95 },
  { name: 'Kekäle', slug: 'kekale', zoneId: 'east-gallery', x: 958, y: 90, w: 50, h: 80 },
  { name: 'Minimani', slug: 'minimani', zoneId: 'east-anchor', x: 974, y: 114, w: 104, h: 257 },
  { name: 'Ideapark Autoareena', slug: 'autoareena', zoneId: 'autoareena', x: 1150, y: 230, w: 160, h: 40 },
  { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', zoneId: 'east-strip', x: 1000, y: 280, w: 105, h: 70 },
  { name: 'Intersport Ideapark', slug: 'intersport-ideapark', zoneId: 'east-strip', x: 820, y: 358, w: 140, h: 58 },
  { name: 'Guess', slug: 'guess', zoneId: 'east-strip', x: 1105, y: 280, w: 95, h: 95 },
  { name: 'Juve Sport', slug: 'juve-sport', zoneId: 'center-hub', x: 406, y: 328, w: 42, h: 42 },
  { name: "Marc O'Polo", slug: 'marc-o-polo', zoneId: 'center-hub', x: 542, y: 340, w: 52, h: 38 },
  { name: 'Suomen Kultajousi', slug: 'suomen-kultajousi', zoneId: 'center-hub', x: 700, y: 372, w: 68, h: 30 },
  { name: 'CHANGE Lingerie', slug: 'change-lingerie', zoneId: 'center-hub', x: 900, y: 408, w: 72, h: 40 },
  { name: 'Cafe Deliss', slug: 'cafe-deliss', zoneId: 'food-court', x: 594, y: 340, w: 52, h: 38 },
  { name: 'Seoul Good', slug: 'seoul-good', zoneId: 'food-court', x: 648, y: 340, w: 52, h: 38 },
  { name: 'Ståhlberg Home Bakery', slug: 'stahlberg-home-bakery', zoneId: 'food-court', x: 320, y: 390, w: 80, h: 42 },
  { name: 'Flying Tiger', slug: 'flying-tiger', zoneId: 'food-court', x: 310, y: 355, w: 55, h: 38 },
  { name: 'Subway', slug: 'subway', zoneId: 'food-court', x: 428, y: 390, w: 40, h: 38 },
  { name: '& Burgers', slug: 'burgers', zoneId: 'food-court', x: 468, y: 390, w: 48, h: 38 },
  { name: 'VileThai', slug: 'vilethai', zoneId: 'food-court', x: 542, y: 400, w: 52, h: 40 },
  { name: 'Kotipizza', slug: 'kotipizza', zoneId: 'food-court', x: 594, y: 400, w: 52, h: 45 },
  { name: 'HESBURGER', slug: 'hesburger', zoneId: 'food-court', x: 648, y: 400, w: 60, h: 58 },
  { name: 'Burger King', slug: 'burger-king', zoneId: 'food-court', x: 648, y: 460, w: 60, h: 58 },
  { name: 'RAX PizzaBuffet', slug: 'rax-pizzabuffet', zoneId: 'food-court', x: 712, y: 440, w: 65, h: 55 },
  { name: 'Kauppahuone Riveri', slug: 'kauppahuone-riveri', zoneId: 'west-arc', x: 52, y: 455, w: 125, h: 110 },
  { name: 'New Yorker', slug: 'new-yorker', zoneId: 'west-arc', x: 177, y: 455, w: 118, h: 100 },
  { name: 'Only', slug: 'only', zoneId: 'west-arc', x: 180, y: 358, w: 42, h: 45 },
  { name: 'Sinsay', slug: 'sinsay', zoneId: 'west-arc', x: 296, y: 500, w: 90, h: 110 },
  { name: 'Apteekki', slug: 'apteekki', zoneId: 'west-arc', x: 386, y: 455, w: 68, h: 75 },
  { name: 'Finlayson', slug: 'finlayson', zoneId: 'west-arc', x: 454, y: 455, w: 68, h: 65 },
  { name: 'Stadium', slug: 'stadium', zoneId: 'west-arc', x: 366, y: 505, w: 130, h: 100 },
  { name: 'Luhta Brand Store', slug: 'luhta-brand-store', zoneId: 'west-arc', x: 470, y: 540, w: 100, h: 70 },
  { name: 'H&M', slug: 'hm', zoneId: 'west-arc', x: 572, y: 555, w: 90, h: 80 },
  { name: 'Dressmann', slug: 'dressmann', zoneId: 'east-arc', x: 665, y: 555, w: 90, h: 75 },
  { name: 'Lindex', slug: 'lindex', zoneId: 'east-arc', x: 710, y: 488, w: 88, h: 40 },
  { name: 'KAPPAHL', slug: 'kappahl', zoneId: 'east-arc', x: 710, y: 395, w: 118, h: 90 },
  { name: 'Pentik', slug: 'pentik', zoneId: 'east-arc', x: 830, y: 395, w: 80, h: 80 },
  { name: 'My Bag', slug: 'my-bag', zoneId: 'east-arc', x: 910, y: 395, w: 42, h: 50 },
  { name: 'Gant', slug: 'gant', zoneId: 'east-arc', x: 910, y: 495, w: 55, h: 45 },
  { name: 'Cropp', slug: 'cropp', zoneId: 'east-arc', x: 970, y: 490, w: 42, h: 45 },
  { name: 'Bik Bok', slug: 'bik-bok', zoneId: 'east-arc', x: 790, y: 560, w: 42, h: 30 },
  { name: 'Marimekko Outlet', slug: 'marimekko-outlet', zoneId: 'east-arc', x: 1058, y: 432, w: 21, h: 57 },
  { name: 'Unikulma', slug: 'unikulma', zoneId: 'east-arc', x: 1020, y: 512, w: 172, h: 50 },
  { name: 'iittala outlet', slug: 'iittala-outlet', zoneId: 'east-arc', x: 960, y: 530, w: 58, h: 55 },
]

async function main() {
  console.log('Seeding floorplan zones and stores for Ideapark Lempäälä...')

  // Build a map: zoneId → DB record id
  const zoneDbIds: Record<string, string> = {}

  // Upsert ground floor zones
  for (const z of GROUND_ZONES) {
    const rec = await prisma.floorplanZone.upsert({
      where: { mallId_floor_zoneId: { mallId: MALL_ID, floor: 'ground', zoneId: z.zoneId } },
      update: { name: z.name, nameFi: z.nameFi, category: z.category, svgPoints: z.svgPoints, labelX: z.labelX, labelY: z.labelY, capacity: z.capacity, areaSqm: z.areaSqm },
      create: { mallId: MALL_ID, floor: 'ground', zoneId: z.zoneId, name: z.name, nameFi: z.nameFi, category: z.category, svgPoints: z.svgPoints, labelX: z.labelX, labelY: z.labelY, capacity: z.capacity, areaSqm: z.areaSqm },
    })
    zoneDbIds[z.zoneId] = rec.id
  }

  // Upsert upper floor zones
  for (const z of UPPER_ZONES) {
    const rec = await prisma.floorplanZone.upsert({
      where: { mallId_floor_zoneId: { mallId: MALL_ID, floor: 'upper', zoneId: z.zoneId } },
      update: { name: z.name, nameFi: z.nameFi, category: z.category, svgPoints: z.svgPoints, labelX: z.labelX, labelY: z.labelY, capacity: z.capacity, areaSqm: z.areaSqm },
      create: { mallId: MALL_ID, floor: 'upper', zoneId: z.zoneId, name: z.name, nameFi: z.nameFi, category: z.category, svgPoints: z.svgPoints, labelX: z.labelX, labelY: z.labelY, capacity: z.capacity, areaSqm: z.areaSqm },
    })
    zoneDbIds[z.zoneId] = rec.id
  }

  console.log(`  Zones seeded: ${Object.keys(zoneDbIds).length}`)

  // Delete existing stores for this mall, then re-create
  await prisma.floorplanStore.deleteMany({ where: { mallId: MALL_ID } })

  for (const s of GROUND_STORES) {
    const zoneDbId = zoneDbIds[s.zoneId]
    if (!zoneDbId) {
      console.warn(`  Skipping store "${s.name}" — zone "${s.zoneId}" not found`)
      continue
    }
    await prisma.floorplanStore.create({
      data: { mallId: MALL_ID, floor: 'ground', name: s.name, slug: s.slug, zoneDbId, x: s.x, y: s.y, w: s.w, h: s.h },
    })
  }

  console.log(`  Stores seeded: ${GROUND_STORES.length}`)
  console.log('Done.')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
