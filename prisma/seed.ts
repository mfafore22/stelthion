import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Company 1: Acme Inc
  const hashedPassword1 = await bcrypt.hash('admin123', 10)
  const acme = await prisma.customer.upsert({
    where: { id: 'acme-inc' },
    update: {},
    create: {
      id: 'acme-inc',
      name: 'Acme Inc.',
    },
  })
  
  await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: hashedPassword1,
      name: 'John Admin',
      role: 'ADMIN',
      customerId: acme.id,
    },
  })

  // Company 2: Beta Corp
  const hashedPassword2 = await bcrypt.hash('admin123', 10)
  const beta = await prisma.customer.upsert({
    where: { id: 'beta-corp' },
    update: {},
    create: {
      id: 'beta-corp',
      name: 'Beta Corp',
    },
  })
  
  await prisma.user.upsert({
    where: { email: 'admin@beta.com' },
    update: {},
    create: {
      email: 'admin@beta.com',
      password: hashedPassword2,
      name: 'Jane Admin',
      role: 'ADMIN',
      customerId: beta.id,
    },
  })

  // Company 3: Gamma Ltd
  const hashedPassword3 = await bcrypt.hash('admin123', 10)
  const gamma = await prisma.customer.upsert({
    where: { id: 'gamma-ltd' },
    update: {},
    create: {
      id: 'gamma-ltd',
      name: 'Gamma Ltd',
    },
  })
  
  await prisma.user.upsert({
    where: { email: 'admin@gamma.com' },
    update: {},
    create: {
      email: 'admin@gamma.com',
      password: hashedPassword3,
      name: 'Bob Admin',
      role: 'ADMIN',
      customerId: gamma.id,
    },
  })

  console.log('Seeded: Acme Inc, Beta Corp, Gamma Ltd')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })