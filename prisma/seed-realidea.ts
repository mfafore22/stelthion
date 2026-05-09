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
import { PrismaClient } from '@prisma/client'
import { seedRealidea } from './seed-realidea-data'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function seedDemoUser(customerId: string) {
  const email = process.env.REALIDEA_DEMO_EMAIL
  if (!email) {
    console.log('REALIDEA_DEMO_EMAIL not set - skipping demo user creation.')
    return
  }
  const password = process.env.REALIDEA_DEMO_PASSWORD
  if (!password) {
    console.log('REALIDEA_DEMO_PASSWORD not set - skipping demo user creation.')
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

  const customer = await seedRealidea(prisma)
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
