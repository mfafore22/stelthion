/**
 * Seed: Video Analysis demo data
 * NON-DESTRUCTIVE: checks if demo data exists, skips if already seeded.
 *
 * Usage:
 *   npx tsx prisma/seed-analysis.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

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

export async function seedAnalysis(prisma: PrismaClient) {
  const MALL_ID = 'ideapark'

  // Check if already seeded
  const existing = await prisma.analysisJob.findMany({
    where: { requestedBy: 'demo-seed' },
    select: { id: true },
  })
  if (existing.length > 0) {
    console.log(`  ✅ Analysis demo data already exists (${existing.length} jobs) — skipping.`)
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
    console.log('  ⚠ No cameras found — skipping analysis seed')
    return
  }
  if (zones.length < 3) {
    console.log('  ⚠ Too few named zones — skipping journey seed')
  }

  console.log(`  Found ${cameras.length} cameras, ${zones.length} named zones`)

  // ── Job 1: ZONE_COUNT ─────────────────────────────────────────────────────

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

  console.log(`  ✓ Job 1: ZONE_COUNT — ${cam1.label}, ${hourlyCounts.reduce((a, b) => a + b, 0)} visitors`)

  // ── Job 2: AB_TRACKING ────────────────────────────────────────────────────

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

    console.log(`  ✓ Job 2: AB_TRACKING — ${camA.label} → ${camB.label}, 87 tagged / 34 matched`)
  }

  // ── Job 3: JOURNEY_MAP ────────────────────────────────────────────────────

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

    const zoneNames = selectedZones.map((z) => z.name).join(', ')
    console.log(`  ✓ Job 3: JOURNEY_MAP — ${zoneNames}, 142 tagged / 58 matched, 15 paths`)
  }

  // ── Job 4: ZONE_COUNT (pending) ───────────────────────────────────────────

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

  console.log(`  ✓ Job 4: ZONE_COUNT (PENDING) — queued for today`)

  // ── Job 5: AB_TRACKING (processing) ───────────────────────────────────────

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

    console.log(`  ✓ Job 5: AB_TRACKING (PROCESSING) — in progress`)
  }
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────

if (require.main === module || process.argv[1]?.endsWith('seed-analysis.ts')) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  console.log('Seeding video analysis demo data (non-destructive)…')
  seedAnalysis(prisma)
    .then(async () => {
      console.log('Done.')
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error('Seed failed:', e)
      await prisma.$disconnect()
      process.exit(1)
    })
}