import "dotenv/config"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { seedRealidea } from './seed-realidea-data'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database (non-destructive)...')

  const primaryCustomer = await seedRealidea(prisma)
  console.log(`Realidea Oy seeded as primary production tenant (${primaryCustomer.id}).`)

  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  const seedAdmins = (process.env.SEED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, name] = entry.split('|').map((part) => part?.trim())
      if (!email) throw new Error(`Invalid SEED_ADMIN_EMAILS entry: "${entry}"`)
      return { email, name: name || email.split('@')[0], role: 'ADMIN' as const }
    })

  if (!seedPassword || seedAdmins.length === 0) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_ADMIN_EMAILS must be set (gitignored .env.local). ' +
      'Format: SEED_ADMIN_EMAILS="user1@example.com|Display Name,user2@example.com"',
    )
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10)

  // ── KOY IDEAPARK AB ─────────────────────────────────────
  const ideapark = await prisma.customer.upsert({
    where: { id: 'ideapark' },
    update: { name: 'Koy Ideapark Ab' },
    create: { id: 'ideapark', name: 'Koy Ideapark Ab' },
  })

  const users = seedAdmins

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        customerId: primaryCustomer.id,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        customerId: primaryCustomer.id,
      },
    })
    console.log(`  User: ${u.email} (${u.role}, customer=${primaryCustomer.id})`)
  }

  // Upsert mall
  await prisma.mall.upsert({
    where: { mallId: 'ideapark-lempaala' },
    update: {
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
      status: 'ALPHA',
    },
    create: {
      mallId: 'ideapark-lempaala',
      name: 'Ideapark Lempäälä',
      city: 'Lempäälä',
      totalShops: 163,
      status: 'ALPHA',
      customerId: ideapark.id,
    },
  })

  // Upsert stats
  const existingStats = await prisma.mallStats.findFirst({ where: { mallId: 'ideapark-lempaala' } })
  if (!existingStats) {
    await prisma.mallStats.create({
      data: {
        mallId: 'ideapark-lempaala',
        currentVisitors: 3900,
        annualVisitors: 5000000,
        annualSales: 180000000,
        dwellTime: 108,
        conversionRate: 23.4,
      },
    })
  }

  // Upsert branding
  const existingBranding = await prisma.mallBranding.findFirst({ where: { mallId: 'ideapark-lempaala' } })
  if (!existingBranding) {
    await prisma.mallBranding.create({
      data: {
        mallId: 'ideapark-lempaala',
        primaryColor: '#328d2e',
        secondaryColor: '#7cb928',
        accentColor: '#214990',
        gradientFrom: '#264d21',
        gradientTo: '#1a3a15',
      },
    })
  }

  // Upsert categories
  const categories = [
    { mallId: 'ideapark-lempaala', name: 'Fashion', shopCount: 50, percentage: 21.5 },
    { mallId: 'ideapark-lempaala', name: 'Food & Beverage', shopCount: 22, percentage: 13.5 },
    { mallId: 'ideapark-lempaala', name: 'Auto', shopCount: 12, percentage: 7.4 },
    { mallId: 'ideapark-lempaala', name: 'Sports', shopCount: 26, percentage: 16.0 },
    { mallId: 'ideapark-lempaala', name: 'Home & Living', shopCount: 23, percentage: 14.1 },
    { mallId: 'ideapark-lempaala', name: 'Services', shopCount: 34, percentage: 20.9 },
    { mallId: 'ideapark-lempaala', name: 'Beauty & Health', shopCount: 17, percentage: 10.4 },
    { mallId: 'ideapark-lempaala', name: 'Children', shopCount: 17, percentage: 10.4 },
    { mallId: 'ideapark-lempaala', name: 'Daily Goods & Tech', shopCount: 9, percentage: 5.5 },
  ]

  for (const cat of categories) {
    await prisma.mallCategory.upsert({
      where: { mallId_name: { mallId: cat.mallId, name: cat.name } },
      update: { shopCount: cat.shopCount, percentage: cat.percentage },
      create: cat,
    })
  }

  console.log('✅ Ideapark: 1 mall seeded')
  console.log('🌱 Seeding complete. Production admin logins default to Realidea Oy.')
  console.log(`Seeded ${users.length} admin account(s); credentials supplied via env.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
