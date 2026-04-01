import "dotenv/config"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database (non-destructive upsert)...')

  const hashedPassword = await bcrypt.hash('ideapark2024', 10)

  // ── KOY IDEAPARK AB ─────────────────────────────────────
  const ideapark = await prisma.customer.upsert({
    where: { id: 'ideapark' },
    update: { name: 'Koy Ideapark Ab' },
    create: { id: 'ideapark', name: 'Koy Ideapark Ab' },
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

  // Upsert mall
  await prisma.mall.upsert({
    where: { mallId: 'ideapark' },
    update: {
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
    },
    create: {
      mallId: 'ideapark',
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
      status: 'LIVE',
      customerId: ideapark.id,
    },
  })

  // Upsert stats (one per mall)
  const existingStats = await prisma.mallStats.findFirst({ where: { mallId: 'ideapark' } })
  if (!existingStats) {
    await prisma.mallStats.create({
      data: {
        mallId: 'ideapark',
        currentVisitors: 3900,
        annualVisitors: 5000000,
        annualSales: 180000000,
        dwellTime: 108,
        conversionRate: 23.4,
      },
    })
  }

  // Upsert branding (one per mall)
  const existingBranding = await prisma.mallBranding.findFirst({ where: { mallId: 'ideapark' } })
  if (!existingBranding) {
    await prisma.mallBranding.create({
      data: {
        mallId: 'ideapark',
        primaryColor: '#328d2e',
        secondaryColor: '#7cb928',
        accentColor: '#214990',
        gradientFrom: '#264d21',
        gradientTo: '#1a3a15',
      },
    })
  }

  // Upsert categories — replace with current data
  await prisma.mallCategory.deleteMany({ where: { mallId: 'ideapark' } })
  await prisma.mallCategory.createMany({
    data: [
      { mallId: 'ideapark', name: 'Fashion', shopCount: 50, percentage: 21.5 },
      { mallId: 'ideapark', name: 'Food & Beverage', shopCount: 22, percentage: 13.5 },
      { mallId: 'ideapark', name: 'Auto', shopCount: 12, percentage: 7.4 },
      { mallId: 'ideapark', name: 'Sports', shopCount: 26, percentage: 16.0 },
      { mallId: 'ideapark', name: 'Home & Living', shopCount: 23, percentage: 14.1 },
      { mallId: 'ideapark', name: 'Services', shopCount: 34, percentage: 20.9 },
      { mallId: 'ideapark', name: 'Beauty & Health', shopCount: 17, percentage: 10.4 },
      { mallId: 'ideapark', name: 'Children', shopCount: 17, percentage: 10.4 },
      { mallId: 'ideapark', name: 'Daily Goods & Tech', shopCount: 9, percentage: 5.5 },
    ],
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
