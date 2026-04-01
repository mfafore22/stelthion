import "dotenv/config"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clear existing data (in reverse dependency order)
  await prisma.mallCategory.deleteMany()
  await prisma.mallBranding.deleteMany()
  await prisma.mallStats.deleteMany()
  await prisma.mall.deleteMany()
  await prisma.emailOtp.deleteMany()
  await prisma.user.deleteMany()
  await prisma.customer.deleteMany()

  const hashedPassword = await bcrypt.hash('ideapark2024', 10)

  // ── KOY IDEAPARK AB ─────────────────────────────────────
  const ideapark = await prisma.customer.create({
    data: {
      id: 'koy-ideapark-ab',
      name: 'Koy Ideapark Ab',
    },
  })

  const users = [
    { email: 'faforemichael001@gmail.com', name: 'Michael Fafore', role: 'ADMIN' as const },
    { email: 'kimmoisbjornssund@pm.me', name: 'Kimmo Isbjörnssund', role: 'ADMIN' as const },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        customerId: ideapark.id,
      },
    })
    console.log(`  User: ${u.email} (${u.role})`)
  }

  await prisma.mall.create({
    data: {
      mallId: 'ideapark',
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
      status: 'LIVE',
      customerId: ideapark.id,
      stats: {
        create: {
          currentVisitors: 3900,
          annualVisitors: 5000000,
          annualSales: 180000000,
          dwellTime: 108,
          conversionRate: 23.4,
        },
      },
      branding: {
        create: {
          primaryColor: '#328d2e',
          secondaryColor: '#7cb928',
          accentColor: '#214990',
          gradientFrom: '#264d21',
          gradientTo: '#1a3a15',
        },
      },
      categories: {
        create: [
          { name: 'Fashion', shopCount: 50, percentage: 21.5 },
          { name: 'Food & Beverage', shopCount: 22, percentage: 13.5 },
          { name: 'Auto', shopCount: 12, percentage: 7.4 },
          { name: 'Sports', shopCount: 26, percentage: 16.0 },
          { name: 'Home & Living', shopCount: 23, percentage: 14.1 },
          { name: 'Services', shopCount: 34, percentage: 20.9 },
          { name: 'Beauty & Health', shopCount: 17, percentage: 10.4 },
          { name: 'Children', shopCount: 17, percentage: 10.4 },
          { name: 'Daily Goods & Tech', shopCount: 9, percentage: 5.5 },
        ],
      },
    },
  })
  console.log('Ideapark: 1 mall seeded')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())