import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Ideapark Lempäälä (single-tenant)…')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // ── Customer ────────────────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { id: 'ideapark' },
    update: { name: 'Koy Ideapark Lempäälä' },
    create: {
      id: 'ideapark',
      name: 'Koy Ideapark Lempäälä',
    },
  })

  // ── Admin user ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@ideapark.fi' },
    update: { password: hashedPassword, name: 'Ideapark Admin', role: 'ADMIN', customerId: customer.id },
    create: {
      email: 'admin@ideapark.fi',
      password: hashedPassword,
      name: 'Ideapark Admin',
      role: 'ADMIN',
      customerId: customer.id,
    },
  })

  // ── Mall ────────────────────────────────────────────────────────────────
  const mall = await prisma.mall.upsert({
    where: { mallId: 'ideapark' },
    update: { name: 'Ideapark Lempäälä', city: 'Lempäälä', address: 'Ideaparkinkatu 4, 37570 Lempäälä', totalShops: 85, customerId: customer.id },
    create: {
      mallId: 'ideapark',
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      address: 'Ideaparkinkatu 4, 37570 Lempäälä',
      totalShops: 85,
      status: 'LIVE',
      customerId: customer.id,
    },
  })

  // ── MallStats ───────────────────────────────────────────────────────────
  await prisma.mallStats.upsert({
    where: { mallId: mall.mallId },
    update: {},
    create: {
      mallId: mall.mallId,
      currentVisitors: 0,
      annualVisitors: 5400000,
      annualSales: 180000000,
      dwellTime: 72,
      conversionRate: 0.34,
    },
  })

  // ── MallBranding ────────────────────────────────────────────────────────
  await prisma.mallBranding.upsert({
    where: { mallId: mall.mallId },
    update: {},
    create: {
      mallId: mall.mallId,
      primaryColor: '#264d21',
      secondaryColor: '#3d7a36',
      accentColor: '#60a5fa',
      backgroundColor: '#F8F6F3',
      gradientFrom: '#264d21',
      gradientTo: '#1a3a15',
    },
  })

  // ── MallCategories ──────────────────────────────────────────────────────
  const categories = [
    { name: 'Fashion & Clothing', shopCount: 28, percentage: 32.9 },
    { name: 'Food & Beverage', shopCount: 14, percentage: 16.5 },
    { name: 'Home & Living', shopCount: 10, percentage: 11.8 },
    { name: 'Sports & Outdoor', shopCount: 8, percentage: 9.4 },
    { name: 'Beauty & Health', shopCount: 6, percentage: 7.1 },
    { name: 'Electronics', shopCount: 4, percentage: 4.7 },
    { name: 'Grocery & Anchor', shopCount: 5, percentage: 5.9 },
    { name: 'Services', shopCount: 6, percentage: 7.1 },
    { name: 'Auto', shopCount: 1, percentage: 1.2 },
    { name: 'Entertainment', shopCount: 3, percentage: 3.5 },
  ]

  for (const cat of categories) {
    await prisma.mallCategory.upsert({
      where: { mallId_name: { mallId: mall.mallId, name: cat.name } },
      update: { shopCount: cat.shopCount, percentage: cat.percentage },
      create: { mallId: mall.mallId, name: cat.name, shopCount: cat.shopCount, percentage: cat.percentage },
    })
  }

  // ── Clean up other customers (if any exist from previous seeds) ─────────
  const others = await prisma.customer.findMany({ where: { id: { not: 'ideapark' } } })
  if (others.length > 0) {
    console.log(`  Removing ${others.length} non-Ideapark customer(s)…`)
    // Delete users first (FK), then customers
    await prisma.user.deleteMany({ where: { customerId: { not: 'ideapark' } } })
    await prisma.customer.deleteMany({ where: { id: { not: 'ideapark' } } })
  }

  console.log('Seeded:')
  console.log(`  Customer: ${customer.name}`)
  console.log(`  Mall: ${mall.name} (${mall.mallId})`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Login: admin@ideapark.fi / admin123`)
  console.log('Done.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
