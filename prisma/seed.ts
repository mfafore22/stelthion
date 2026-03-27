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
      id: 'ideapark',
      name: 'Koy Ideapark Ab',
    },
  })

  const users = [
    { email: 'admin@ideapark.fi', name: 'KoyIdeaparkOy', role: 'ADMIN' as const },
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
      totalShops: 200,
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
          { name: 'Fashion', shopCount: 60, percentage: 30 },
          { name: 'Food & Beverage', shopCount: 40, percentage: 20 },
          { name: 'Auto', shopCount: 20, percentage: 10 },
          { name: 'Sports', shopCount: 30, percentage: 15 },
          { name: 'Home & Living', shopCount: 25, percentage: 12.5 },
          { name: 'Services', shopCount: 25, percentage: 12.5 },
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