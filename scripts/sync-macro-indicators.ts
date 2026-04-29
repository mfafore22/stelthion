/**
 * Sync macroeconomic indicators from public APIs (Tilastokeskus PxWeb) into
 * the MacroIndicatorPoint table. Idempotent: upserts on (indicatorCode, period).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/sync-macro-indicators.ts
 *   npx tsx --env-file=.env.local scripts/sync-macro-indicators.ts fi-consumer-confidence
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { fetchStatFin } from '../src/lib/shoppermind/statfin'
import { FI_INDICATORS, type MacroIndicatorMeta } from '../src/lib/shoppermind/macro-indicators'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function syncOne(meta: MacroIndicatorMeta) {
  const label = `[${meta.code}]`
  try {
    const { points } = await fetchStatFin(meta.fetch)
    if (points.length === 0) {
      console.log(`${label} no points returned (table or query may need adjustment)`)
      return { code: meta.code, count: 0, error: 'no-points' as const }
    }
    let upserted = 0
    for (const p of points) {
      await prisma.macroIndicatorPoint.upsert({
        where: { indicatorCode_period: { indicatorCode: meta.code, period: p.period } },
        update: { value: p.value, periodDate: p.periodDate, fetchedAt: new Date() },
        create: {
          indicatorCode: meta.code,
          country: meta.country,
          period: p.period,
          periodDate: p.periodDate,
          value: p.value,
        },
      })
      upserted++
    }
    console.log(`${label} ${upserted} points (${points[points.length - 1].period} = ${points[points.length - 1].value})`)
    return { code: meta.code, count: upserted, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`${label} FAILED: ${msg}`)
    return { code: meta.code, count: 0, error: msg }
  }
}

async function main() {
  const onlyCode = process.argv[2]
  const list = onlyCode ? FI_INDICATORS.filter((i) => i.code === onlyCode) : FI_INDICATORS
  if (list.length === 0) {
    console.error(`No indicator matches '${onlyCode}'.`)
    process.exit(1)
  }
  console.log(`Syncing ${list.length} indicator(s)...`)
  const results = await Promise.all(list.map(syncOne))
  const ok = results.filter((r) => r.error === null).length
  const fail = results.length - ok
  console.log(`\nDone: ${ok} OK, ${fail} failed.`)
  if (fail > 0) process.exit(2)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
