/**
 * Sync macroeconomic indicators from public APIs (StatFin/SCB/KI/FRED) into
 * the MacroIndicatorPoint table. Idempotent: upserts on (indicatorCode, period).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/sync-macro-indicators.ts
 *   npx tsx --env-file=.env.local scripts/sync-macro-indicators.ts fi-consumer-confidence
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { syncAllIndicators } from '../src/lib/shoppermind/sync-macro'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const onlyCode = process.argv[2]
  const summary = await syncAllIndicators(prisma, onlyCode)
  console.log(`Syncing ${summary.results.length} indicator(s)...`)
  for (const r of summary.results) {
    if (r.error) console.error(`[${r.code}] FAILED: ${r.error}`)
    else if (r.skipped) console.log(`[${r.code}] skipped: no fetch adapter configured`)
    else console.log(`[${r.code}] ${r.count} points`)
  }
  console.log(`\nDone: ${summary.ok} OK, ${summary.skipped} skipped, ${summary.failed} failed.`)
  if (summary.failed > 0) process.exit(2)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
