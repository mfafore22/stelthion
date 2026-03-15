import 'dotenv/config'

async function main() {
  // Dynamic imports to avoid TypeScript conflicts
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const pg = await import('pg')
  const bcrypt = await import('bcrypt')

  const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL })
  const adapter = new PrismaPg(pool as any)
  const prisma = new PrismaClient({ adapter } as any)

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Company 1: Acme Inc
  const acme = await prisma.customer.upsert({
    where: { id: 'acme-inc' },
    update: {},
    create: { id: 'acme-inc', name: 'Acme Inc.' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'John Admin',
      role: 'ADMIN',
      customerId: acme.id,
    },
  })

  await prisma.stats.upsert({
    where: { customerId: acme.id },
    update: {},
    create: {
      customerId: acme.id,
      totalUnits: 189,
      topCategory: 'Restaurant',
      foodBeverage: 29.6,
      fashionRetail: 18.0,
      currentVisitors: 1500,
      dwellTime: 45,
      conversionRate: 23,
    },
  })

  // Company 2: Beta Corp
  const beta = await prisma.customer.upsert({
    where: { id: 'beta-corp' },
    update: {},
    create: { id: 'beta-corp', name: 'Beta Corp' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@beta.com' },
    update: {},
    create: {
      email: 'admin@beta.com',
      password: hashedPassword,
      name: 'Jane Admin',
      role: 'ADMIN',
      customerId: beta.id,
    },
  })

  await prisma.stats.upsert({
    where: { customerId: beta.id },
    update: {},
    create: {
      customerId: beta.id,
      totalUnits: 75,
      topCategory: 'Fashion',
      foodBeverage: 15.5,
      fashionRetail: 42.0,
      currentVisitors: 820,
      dwellTime: 32,
      conversionRate: 18,
    },
  })

  // Company 3: Gamma Ltd
  const gamma = await prisma.customer.upsert({
    where: { id: 'gamma-ltd' },
    update: {},
    create: { id: 'gamma-ltd', name: 'Gamma Ltd' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@gamma.com' },
    update: {},
    create: {
      email: 'admin@gamma.com',
      password: hashedPassword,
      name: 'Bob Admin',
      role: 'ADMIN',
      customerId: gamma.id,
    },
  })

  await prisma.stats.upsert({
    where: { customerId: gamma.id },
    update: {},
    create: {
      customerId: gamma.id,
      totalUnits: 320,
      topCategory: 'Electronics',
      foodBeverage: 8.2,
      fashionRetail: 12.5,
      currentVisitors: 2100,
      dwellTime: 55,
      conversionRate: 31,
    },
  })

  console.log('✅ Seeded: Acme Inc, Beta Corp, Gamma Ltd with stats')

  await pool.end()
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})