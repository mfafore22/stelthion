/**
 * Seed: Realidea Oy customer + 18 mall properties.
 * NON-DESTRUCTIVE / idempotent: upserts on Customer.id and Mall.mallId.
 *
 * Optionally provisions a demo user when REALIDEA_DEMO_EMAIL is set.
 * The password is taken from REALIDEA_DEMO_PASSWORD (defaults to a safe
 * dev placeholder). Email gets the OTP for the 2FA step, so use a real
 * mailbox you can read.
 *
 * Usage:
 *   npx tsx --env-file=.env prisma/seed-realidea.ts
 *
 *   # with demo user:
 *   REALIDEA_DEMO_EMAIL='you+realidea@proton.me' \
 *   REALIDEA_DEMO_PASSWORD='your-pick' \
 *     npx tsx --env-file=.env prisma/seed-realidea.ts
 */

import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, MallStatus } from '@prisma/client'
import { getSelloTenantSummary } from '../src/lib/data/selloTenantMix'

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
  { mallId: 'realidea-sello', name: 'Sello', city: 'Espoo', status: 'LIVE', totalShops: 163 },
  { mallId: 'realidea-tripla', name: 'Mall of Tripla', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-kamp-galleria', name: 'Kämp Galleria', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-karuselli', name: 'Karuselli', city: 'Kerava', status: 'LIVE' },
  { mallId: 'realidea-plaza', name: 'Plaza', city: 'Salo', status: 'LIVE' },
  { mallId: 'realidea-arabia', name: 'Arabia', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-columbus', name: 'Columbus', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-duo', name: 'Duo', city: 'Tampere', status: 'LIVE' },
  { mallId: 'realidea-grani', name: 'Grani', city: 'Kauniainen', status: 'LIVE' },
  { mallId: 'realidea-dixi', name: 'Dixi', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-entresse', name: 'Entresse', city: 'Espoo', status: 'LIVE' },
  { mallId: 'realidea-fresko', name: 'Fresko', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-kale', name: 'Kale', city: 'Tampere', status: 'LIVE' },
  { mallId: 'realidea-kivis', name: 'Kivis', city: 'Vantaa', status: 'LIVE' },
  { mallId: 'realidea-liila', name: 'Liila', city: 'Espoo', status: 'LIVE' },
  { mallId: 'realidea-lansikeskus', name: 'Länsikeskus', city: 'Espoo', status: 'LIVE' },
  { mallId: 'realidea-malmin-nova', name: 'Malmin Nova', city: 'Helsinki', status: 'LIVE' },
  { mallId: 'realidea-martinlaakso', name: 'Martinlaakson ostari', city: 'Vantaa', status: 'LIVE' },
]

async function seedSelloStub() {
  // Minimal Sello stats row so the portfolio card has something to render
  // before real numbers are entered. Set to zero — operator backfills via UI.
  const existing = await prisma.mallStats.findFirst({ where: { mallId: 'realidea-sello' } })
  if (existing) return
  await prisma.mallStats.create({
    data: {
      mallId: 'realidea-sello',
      currentVisitors: 0,
      annualVisitors: 0,
      annualSales: 0,
      dwellTime: 0,
      conversionRate: 0,
    },
  })
  console.log('  Stats: realidea-sello (zeroed stub)')
}

async function seedSelloCategories() {
  const summary = getSelloTenantSummary()
  for (const cat of summary.topCategories) {
    await prisma.mallCategory.upsert({
      where: { mallId_name: { mallId: 'realidea-sello', name: cat.category } },
      update: { shopCount: cat.count, percentage: cat.percentage },
      create: { mallId: 'realidea-sello', name: cat.category, shopCount: cat.count, percentage: cat.percentage },
    })
  }
  console.log('  Categories: realidea-sello tenant mix')
}

async function seedDemoUser(customerId: string) {
  const email = process.env.REALIDEA_DEMO_EMAIL
  if (!email) {
    console.log('REALIDEA_DEMO_EMAIL not set — skipping demo user creation.')
    return
  }
  const password = process.env.REALIDEA_DEMO_PASSWORD
  if (!password) {
    console.log('REALIDEA_DEMO_PASSWORD not set — skipping demo user creation.')
    return
  }
  const name = process.env.REALIDEA_DEMO_NAME || 'Realidea Demo'
  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { email },
    update: { customerId, name, role: 'USER' },
    create: { email, password: hashed, name, role: 'USER', customerId },
  })
  console.log(`  Demo user: ${email} / ${password} (role=USER, customer=${customerId})`)
}

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

  await seedSelloStub()
  await seedSelloCategories()
  await seedDemoUser(customer.id)

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
