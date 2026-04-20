/**
 * Consolidated Seed for Stelthion
 *
 * Seeds:
 * 1. Customers & Users (Ideapark AB + admins)
 * 2. Malls (Ideapark Lempäälä)
 * 3. Mall Stats, Branding, Categories
 * 4. ShopperMind signal sources
 * 5. ShopperMind demo phenomena
 * 6. Video analysis demo data (jobs, sessions, paths)
 *
 * Floorplan zones + cameras seeded separately by scripts/seed-ideapark-layout.ts
 *
 * Non-destructive: uses upsert + existence checks
 * Usage: npx prisma db seed
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, PhenomenonState } from '@prisma/client'
import bcrypt from 'bcrypt'
import { MARKET_PROFILE } from '../src/services/shoppermind/markets'

const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL or DIRECT_URL environment variable is not set.')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: dbUrl })
const prisma = new PrismaClient({ adapter })

const MALL_ID = 'ideapark'

// ─────────────────────────────────────────────────────────────────────────
// 1. CUSTOMERS & USERS
// ─────────────────────────────────────────────────────────────────────────

async function seedCustomersAndUsers() {
  console.log('Seeding customers & users...')

  const hashedPassword = await bcrypt.hash('ideapark2024', 10)

  const ideapark = await prisma.customer.upsert({
    where: { id: 'ideapark' },
    update: { name: 'Koy Ideapark Ab' },
    create: { id: 'ideapark', name: 'Koy Ideapark Ab' },
  })

  const users = [
    { email: 'faforemichael001@gmail.com', name: 'Michael Fafore', role: 'ADMIN' as const },
    { email: 'kimmoisbjornssund@pm.me', name: 'Kimmo Isbjörnssund', role: 'ADMIN' as const },
  ]

  let userCount = 0
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          password: hashedPassword,
          name: u.name,
          role: u.role,
          customerId: ideapark.id,
        },
      })
      userCount++
    }
  }
  console.log(`  ✓ Customer: Koy Ideapark Ab (${userCount} users)`)
}

// ─────────────────────────────────────────────────────────────────────────
// 2. MALLS
// ─────────────────────────────────────────────────────────────────────────

async function seedMalls() {
  console.log('Seeding malls...')

  const existing = await prisma.mall.findUnique({ where: { mallId: MALL_ID } })
  if (existing) {
    console.log(`  ✓ Mall '${MALL_ID}' already exists`)
    return
  }

  const customer = await prisma.customer.findUnique({ where: { id: 'ideapark' } })
  if (!customer) {
    console.error('  ERROR: Customer not found. Run customer seed first.')
    return
  }

  await prisma.mall.create({
    data: {
      mallId: MALL_ID,
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
      status: 'LIVE',
      customerId: customer.id,
    },
  })

  console.log(`  ✓ Mall: Ideapark Lempäälä`)
}

// ─────────────────────────────────────────────────────────────────────────
// 3. MALL STATS, BRANDING, CATEGORIES
// ─────────────────────────────────────────────────────────────────────────

async function seedMallMetadata() {
  console.log('Seeding mall metadata...')

  const existingStats = await prisma.mallStats.findFirst({ where: { mallId: MALL_ID } })
  if (!existingStats) {
    await prisma.mallStats.create({
      data: {
        mallId: MALL_ID,
        currentVisitors: 3900,
        annualVisitors: 5000000,
        annualSales: 180000000,
        dwellTime: 108,
        conversionRate: 23.4,
      },
    })
  }

  const existingBranding = await prisma.mallBranding.findFirst({ where: { mallId: MALL_ID } })
  if (!existingBranding) {
    await prisma.mallBranding.create({
      data: {
        mallId: MALL_ID,
        primaryColor: '#328d2e',
        secondaryColor: '#7cb928',
        accentColor: '#214990',
        gradientFrom: '#264d21',
        gradientTo: '#1a3a15',
      },
    })
  }

  const categories = [
    { mallId: MALL_ID, name: 'Fashion', shopCount: 50, percentage: 21.5 },
    { mallId: MALL_ID, name: 'Food & Beverage', shopCount: 22, percentage: 13.5 },
    { mallId: MALL_ID, name: 'Auto', shopCount: 12, percentage: 7.4 },
    { mallId: MALL_ID, name: 'Sports', shopCount: 26, percentage: 16.0 },
    { mallId: MALL_ID, name: 'Home & Living', shopCount: 23, percentage: 14.1 },
    { mallId: MALL_ID, name: 'Services', shopCount: 34, percentage: 20.9 },
    { mallId: MALL_ID, name: 'Beauty & Health', shopCount: 17, percentage: 10.4 },
    { mallId: MALL_ID, name: 'Children', shopCount: 17, percentage: 10.4 },
    { mallId: MALL_ID, name: 'Daily Goods & Tech', shopCount: 9, percentage: 5.5 },
  ]

  let catCount = 0
  for (const cat of categories) {
    const existing = await prisma.mallCategory.findUnique({
      where: { mallId_name: { mallId: cat.mallId, name: cat.name } },
    })
    if (!existing) {
      await prisma.mallCategory.create({ data: cat })
      catCount++
    }
  }

  console.log(`  ✓ Stats, Branding, Categories (${catCount} new)`)
}

// ─────────────────────────────────────────────────────────────────────────
// 4. SHOPPERMIND SIGNAL SOURCES
// ─────────────────────────────────────────────────────────────────────────

async function seedSignalSources() {
  console.log('Seeding ShopperMind signal sources...')

  let upserted = 0
  for (const market of Object.values(MARKET_PROFILE)) {
    for (const seed of market.seedSources) {
      const existing = await prisma.signalSource.findFirst({
        where: { name: seed.name, country: market.country },
      })

      const data = {
        name: seed.name,
        type: seed.type,
        url: seed.url,
        country: market.country,
        language: seed.language,
        weight: seed.weight ?? 1.0,
        active: true,
        config: seed.config ? JSON.parse(JSON.stringify(seed.config)) : undefined,
      }

      if (existing) {
        await prisma.signalSource.update({
          where: { id: existing.id },
          data,
        })
      } else {
        await prisma.signalSource.create({ data })
      }
      upserted++
    }
  }

  console.log(`  ✓ Upserted ${upserted} signal sources`)
}

// ─────────────────────────────────────────────────────────────────────────
// 5. SHOPPERMIND DEMO PHENOMENA
// ─────────────────────────────────────────────────────────────────────────

interface DemoPhenomenon {
  label: string
  description: string
  categories: string[]
  keywords: string[]
  state: PhenomenonState
  baseVolume: number
  finalVolume: number
  sources: number
}

const FI_PHENOMENA: DemoPhenomenon[] = [
  {
    label: '[demo] Käytetyn luksuksen kasvu Tampereella',
    description:
      'Käytettyä luksusta myyvät liikkeet ja komissiomyyntikonseptit raportoivat 2–3-kertaisista asiakasmääristä ja vuokratiedusteluista Pirkanmaalla.',
    categories: ['fashion', 'retail-tenancy'],
    keywords: ['käytetty', 'vintage', 'luksus', 'Tampere'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 4,
    finalVolume: 38,
    sources: 6,
  },
  {
    label: '[demo] Viipymäaika pitenee kahvila-ankkureiden ansiosta',
    description:
      'Ravintola- ja kahvilavetoiset ankkurivaihdot (erikoiskahvit, brunssikonseptit) korreloivat 15–20 minuutin viipymäajan kasvun kanssa pohjoismaisissa kauppakeskuksissa.',
    categories: ['f&b', 'footfall-driver'],
    keywords: ['kahvi', 'viipymä', 'brunssi', 'ankkuri'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 6,
    finalVolume: 44,
    sources: 8,
  },
  {
    label: '[demo] Nuorten muotibrändit vetäytyvät keskustoista',
    description:
      'Suomalaiset nuorten muotibrändit keskittyvät alueellisiin kauppakeskuksiin samalla kun keskustakivijalkaliikkeitä suljetaan; signaalit viittaavat kauppakeskusformaattiin.',
    categories: ['fashion', 'retail-tenancy'],
    keywords: ['nuoret', 'keskusta', 'sulkemiset', 'kauppakeskus'],
    state: PhenomenonState.EMERGING,
    baseVolume: 2,
    finalVolume: 18,
    sources: 5,
  },
]

const AE_PHENOMENA: DemoPhenomenon[] = [
  {
    label: '[demo] Off-plan Dubai Marina transactions accelerating',
    description:
      'Primary-market Dubai Marina launches showing sustained velocity in off-plan volumes; secondary listings tightening in parallel.',
    categories: ['residential-sale', 'mixed-use'],
    keywords: ['off-plan', 'Dubai Marina', 'launch', 'primary'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 8,
    finalVolume: 52,
    sources: 9,
  },
]

function buildScoreSeries(d: DemoPhenomenon): Array<{
  date: Date
  volume: number
  velocity: number
  acceleration: number
  noiseAdjusted: number
  sourceDiversity: number
  compositeScore: number
}> {
  const rows: ReturnType<typeof buildScoreSeries> = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const span = 28
  const volumes: number[] = []
  for (let i = 0; i < span; i++) {
    const t = i / (span - 1)
    const lin = d.baseVolume + (d.finalVolume - d.baseVolume) * t
    const jitter = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * Math.max(1, lin * 0.08)
    volumes.push(Math.max(0, Math.round(lin + jitter)))
  }

  const ma7 = (idx: number) => {
    const start = Math.max(0, idx - 6)
    const slice = volumes.slice(start, idx + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  }

  for (let i = 0; i < span; i++) {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() - (span - 1 - i))

    const velocity = i > 0 ? volumes[i] - ma7(i - 1) : 0
    const prevVel = i > 1 ? volumes[i - 1] - ma7(i - 2) : 0
    const acceleration = velocity - prevVel
    const mean = volumes.reduce((s, v) => s + v, 0) / volumes.length
    const mad = (volumes.reduce((s, v) => s + Math.abs(v - mean), 0) / volumes.length) || 1
    const noiseAdjusted = volumes[i] / mad
    const sourceDiversity = Math.min(1, d.sources / Math.max(1, volumes[i]))
    const composite =
      0.35 * clamp((velocity + 10) / 20) +
      0.3 * clamp((acceleration + 10) / 20) +
      0.2 * clamp(noiseAdjusted / 5) +
      0.15 * sourceDiversity

    rows.push({
      date,
      volume: volumes[i],
      velocity: round(velocity),
      acceleration: round(acceleration),
      noiseAdjusted: round(noiseAdjusted),
      sourceDiversity: round(sourceDiversity),
      compositeScore: round(composite),
    })
  }
  return rows
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}
function round(v: number): number {
  return Math.round(v * 1000) / 1000
}

async function seedDemoPhenomena() {
  console.log('Seeding ShopperMind demo phenomena...')

  const existing = await prisma.phenomenon.findFirst({
    where: { label: { startsWith: '[demo]' } },
  })
  if (existing) {
    console.log(`  ✓ Demo phenomena already exist — skipping`)
    return
  }

  let phenomenaCreated = 0

  for (const country of ['FI', 'AE']) {
    const phenomena = country === 'FI' ? FI_PHENOMENA : AE_PHENOMENA
    for (const d of phenomena) {
      const phen = await prisma.phenomenon.create({
        data: {
          label: d.label,
          description: d.description,
          primaryCountry: country,
          categories: d.categories,
          keywords: d.keywords,
          state: d.state,
          firstSeenAt: (() => {
            const dt = new Date()
            dt.setUTCDate(dt.getUTCDate() - 28)
            return dt
          })(),
          lastSignalAt: new Date(),
        },
      })
      phenomenaCreated++

      const scores = buildScoreSeries(d).map((s) => ({
        ...s,
        phenomenonId: phen.id,
        country,
      }))
      await prisma.phenomenonScore.createMany({ data: scores, skipDuplicates: true })
    }
  }

  console.log(`  ✓ Created ${phenomenaCreated} demo phenomena with 28-day score series`)
}

// ─────────────────────────────────────────────────────────────────────────
// 6. VIDEO ANALYSIS DEMO DATA
// ─────────────────────────────────────────────────────────────────────────

function cuid() {
  return `seed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pastDate(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d
}

async function seedAnalysisDemo() {
  console.log('Seeding video analysis demo data...')

  const existing = await prisma.analysisJob.findMany({
    where: { requestedBy: 'demo-seed' },
    select: { id: true },
  })
  if (existing.length > 0) {
    console.log(`  ✓ Analysis demo data already exists (${existing.length} jobs) — skipping`)
    return
  }

  const cameras = await prisma.camera.findMany({
    where: { mallId: MALL_ID, active: true },
    orderBy: { label: 'asc' },
  })

  const zones = await prisma.floorplanZone.findMany({
    where: {
      mallId: MALL_ID,
      publishedAt: { not: null },
      name: { not: 'New Zone' },
    },
    orderBy: { zoneId: 'asc' },
  })

  if (cameras.length === 0) {
    console.log(`  ⚠ No cameras found — skipping analysis seed`)
    return
  }

  let jobsCreated = 0

  if (cameras.length > 0) {
    const job1Id = cuid()
    const cam1 = cameras[0]

    await prisma.analysisJob.create({
      data: {
        id: job1Id,
        mallId: MALL_ID,
        mode: 'ZONE_COUNT',
        cameraId: cam1.id,
        footageDate: pastDate(3),
        startTime: '09:00',
        endTime: '18:00',
        journeyCount: 0,
        status: 'COMPLETE',
        requestedBy: 'demo-seed',
      },
    })

    const hourlyCounts = [120, 185, 310, 480, 520, 445, 510, 490, 380, 220]
    for (let i = 0; i < hourlyCounts.length; i++) {
      await prisma.analysisResult.create({
        data: {
          id: cuid(),
          jobId: job1Id,
          zoneId: cam1.id,
          hour: 9 + i,
          count: hourlyCounts[i],
          density: +(hourlyCounts[i] / 500).toFixed(2),
        },
      })
    }
    jobsCreated++
  }

  if (cameras.length >= 2) {
    const job2Id = cuid()
    const camA = cameras[0]
    const camB = cameras[1]

    await prisma.analysisJob.create({
      data: {
        id: job2Id,
        mallId: MALL_ID,
        mode: 'AB_TRACKING',
        cameraId: camA.id,
        secondaryCameraId: camB.id,
        footageDate: pastDate(2),
        startTime: '10:00',
        endTime: '16:00',
        journeyCount: 10,
        status: 'COMPLETE',
        requestedBy: 'demo-seed',
      },
    })

    const session2Id = cuid()
    await prisma.journeySession.create({
      data: {
        id: session2Id,
        jobId: job2Id,
        taggedCount: 87,
        recognizedCount: 34,
      },
    })

    const baseTime = new Date(pastDate(2))
    baseTime.setHours(10, 0, 0, 0)

    for (let p = 0; p < 10; p++) {
      const entryTime = new Date(baseTime.getTime() + p * 35 * 60000)
      const gapMinutes = randomBetween(4, 22)
      const exitTime = new Date(entryTime.getTime() + gapMinutes * 60000)

      await prisma.journeyPath.create({
        data: {
          id: cuid(),
          sessionId: session2Id,
          zoneSequence: JSON.stringify([camA.id, camB.id]),
          timestamps: JSON.stringify([entryTime.toISOString(), exitTime.toISOString()]),
        },
      })
    }
    jobsCreated++
  }

  if (zones.length >= 3) {
    const job3Id = cuid()
    const selectedZones = zones.slice(0, 5)
    const selectedZoneIds = selectedZones.map((z) => z.id)

    await prisma.analysisJob.create({
      data: {
        id: job3Id,
        mallId: MALL_ID,
        mode: 'JOURNEY_MAP',
        cameraId: cameras[0]?.id ?? null,
        secondaryCameraId: cameras[1]?.id ?? null,
        footageDate: pastDate(1),
        startTime: '10:00',
        endTime: '17:00',
        journeyCount: 15,
        selectedZoneIds: JSON.stringify(selectedZoneIds),
        status: 'COMPLETE',
        requestedBy: 'demo-seed',
      },
    })

    const session3Id = cuid()
    await prisma.journeySession.create({
      data: {
        id: session3Id,
        jobId: job3Id,
        taggedCount: 142,
        recognizedCount: 58,
      },
    })

    const baseTime = new Date(pastDate(1))
    baseTime.setHours(10, 0, 0, 0)

    for (let p = 0; p < 15; p++) {
      const numStops = randomBetween(2, Math.min(4, selectedZones.length))
      const shuffled = [...selectedZoneIds].sort(() => Math.random() - 0.5)
      const visited = shuffled.slice(0, numStops)

      const startTime = new Date(baseTime.getTime() + p * 25 * 60000)
      const timestamps = visited.map((_, i) =>
        new Date(startTime.getTime() + i * randomBetween(3, 15) * 60000).toISOString()
      )

      await prisma.journeyPath.create({
        data: {
          id: cuid(),
          sessionId: session3Id,
          zoneSequence: JSON.stringify(visited),
          timestamps: JSON.stringify(timestamps),
        },
      })
    }
    jobsCreated++
  }

  if (cameras.length > 0) {
    await prisma.analysisJob.create({
      data: {
        id: cuid(),
        mallId: MALL_ID,
        mode: 'ZONE_COUNT',
        cameraId: cameras[cameras.length - 1].id,
        footageDate: pastDate(0),
        startTime: '09:00',
        endTime: '21:00',
        journeyCount: 0,
        status: 'PENDING',
        requestedBy: 'demo-seed',
      },
    })
    jobsCreated++
  }

  if (cameras.length >= 2) {
    await prisma.analysisJob.create({
      data: {
        id: cuid(),
        mallId: MALL_ID,
        mode: 'AB_TRACKING',
        cameraId: cameras[2]?.id ?? cameras[0].id,
        secondaryCameraId: cameras[3]?.id ?? cameras[1].id,
        footageDate: pastDate(0),
        startTime: '10:00',
        endTime: '15:00',
        journeyCount: 5,
        status: 'PROCESSING',
        requestedBy: 'demo-seed',
      },
    })
    jobsCreated++
  }

  console.log(`  ✓ Created ${jobsCreated} analysis jobs with demo data`)
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Stelthion Database Seed (non-destructive)\n')

  try {
    await seedCustomersAndUsers()
    await seedMalls()
    await seedMallMetadata()
    // Floorplan zones + cameras seeded by scripts/seed-ideapark-layout.ts
    await seedSignalSources()
    await seedDemoPhenomena()
    await seedAnalysisDemo()

    console.log('\n✅ Seed complete!')
    console.log('\nLogins:')
    console.log('  faforemichael001@gmail.com / ideapark2024')
    console.log('  kimmoisbjornssund@pm.me / ideapark2024')
  } catch (e) {
    console.error('\n❌ Seed failed:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()