/**
 * Seed: Realidea Oy customer + 18 mall properties.
 * NON-DESTRUCTIVE / idempotent: upserts on Customer.id and Mall.mallId.
 *
 * Usage:
 *   npx tsx prisma/seed-realidea.ts
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, MallStatus } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

const REALIDEA_MALLS: Array<{
  mallId: string
  name: string
  city: string
  status: MallStatus
  totalShops?: number
}> = [
  { mallId: 'realidea-sello', name: 'Sello', city: 'Espoo', status: 'LIVE' },
  { mallId: 'realidea-tripla', name: 'Mall of Tripla', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-itis', name: 'Itis', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-jumbo', name: 'Jumbo', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-kamp-galleria', name: 'Kämp Galleria', city: 'Helsinki', status: 'PLANNED' },
  { mallId: 'realidea-karuselli', name: 'Karuselli', city: 'Kerava', status: 'BETA' },
  { mallId: 'realidea-plaza', name: 'Plaza', city: 'Salo', status: 'ALPHA' },
  { mallId: 'realidea-arabia', name: 'Arabia', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-columbus', name: 'Columbus', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-duo', name: 'Duo', city: 'Tampere', status: 'LIVE' },
  { mallId: 'realidea-grani', name: 'Grani', city: 'Kauniainen', status: 'BETA' },
  { mallId: 'realidea-dixi', name: 'Dixi', city: 'Vantaa', status: 'ALPHA' },
  { mallId: 'realidea-entresse', name: 'Entresse', city: 'Espoo', status: 'LIVE' },
  { mallId: 'realidea-fresko', name: 'Fresko', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-kale', name: 'Kale', city: 'Tampere', status: 'BETA' },
  { mallId: 'realidea-kivis', name: 'Kivis', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-liila', name: 'Liila', city: 'Espoo', status: 'ALPHA' },
  { mallId: 'realidea-lansikeskus', name: 'Länsikeskus', city: 'Espoo', status: 'LIVE' },
]

async function main() {
  console.log('Seeding Realidea Oy customer + malls (idempotent)...')

  const customer = await prisma.customer.upsert({
    where: { id: 'realidea-oy' },
    update: { name: 'Realidea Oy' },
    create: { id: 'realidea-oy', name: 'Realidea Oy' },
  })

  for (const m of REALIDEA_MALLS) {
    await prisma.mall.upsert({
      where: { mallId: m.mallId },
      update: {
        name: m.name,
        city: m.city,
        status: m.status,
        customerId: customer.id,
        ...(m.totalShops !== undefined ? { totalShops: m.totalShops } : {}),
      },
      create: {
        mallId: m.mallId,
        name: m.name,
        city: m.city,
        status: m.status,
        customerId: customer.id,
        totalShops: m.totalShops ?? 0,
      },
    })
    console.log(`  Mall: ${m.mallId} (${m.name}, ${m.city}, ${m.status})`)
  }

  const count = await prisma.mall.count({ where: { customerId: customer.id } })
  console.log(`Realidea Oy: ${count} malls in DB.`)
  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
