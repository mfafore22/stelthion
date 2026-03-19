import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'


const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
})
const prisma = new PrismaClient({adapter})

async function main() {
  console.log('Seeding database...')

  // Clear existing data (in reverse dependency order)
  await prisma.mallCategory.deleteMany()
  await prisma.mallBranding.deleteMany()
  await prisma.mallStats.deleteMany()
  await prisma.mall.deleteMany()
  await prisma.user.deleteMany()
  await prisma.customer.deleteMany()

  // ── REALIDEA ──────────────────────────────────────────────
  const realidea = await prisma.customer.create({
    data: {
      id: 'realidea',
      name: 'Realidea',
      users: {
        create: {
          email: 'admin@realidea.fi',
          password: await bcrypt.hash('admin123', 10),
          name: 'Realidea Admin',
          role: 'ADMIN',
        }
      }
    }
  })

  const realideaMalls = [
    { id: 'tripla',     name: 'Mall of Tripla', city: 'Helsinki', totalShops: 250, status: 'LIVE' as const, annualVisitors: 27300000, annualSales: 342000000, currentVisitors: 2500, dwellTime: 72, conversionRate: 24.5, gradientFrom: '#1e3a5f', gradientTo: '#162d4a', primaryColor: '#1e3a5f' },
    { id: 'sello',      name: 'Sello',          city: 'Espoo',    totalShops: 180, status: 'LIVE' as const, annualVisitors: 21000000, annualSales: 280000000, currentVisitors: 1900, dwellTime: 65, conversionRate: 22.1, gradientFrom: '#1a3a5c', gradientTo: '#122a45', primaryColor: '#1a3a5c' },
    { id: 'jumbo',      name: 'Jumbo',          city: 'Vantaa',   totalShops: 200, status: 'LIVE' as const, annualVisitors: 19500000, annualSales: 265000000, currentVisitors: 1750, dwellTime: 68, conversionRate: 23.0, gradientFrom: '#2d1b69', gradientTo: '#1a0f3e', primaryColor: '#2d1b69' },
    { id: 'kaari',      name: 'Kaari',          city: 'Helsinki', totalShops: 120, status: 'LIVE' as const, annualVisitors: 11000000, annualSales: 145000000, currentVisitors: 980,  dwellTime: 55, conversionRate: 20.5, gradientFrom: '#1e4d3a', gradientTo: '#133024', primaryColor: '#1e4d3a' },
    { id: 'columbus',   name: 'Columbus',       city: 'Helsinki', totalShops: 95,  status: 'LIVE' as const, annualVisitors: 8500000,  annualSales: 112000000, currentVisitors: 760,  dwellTime: 52, conversionRate: 19.8, gradientFrom: '#4a1942', gradientTo: '#2e0f28', primaryColor: '#4a1942' },
    { id: 'itis',       name: 'Itis',           city: 'Helsinki', totalShops: 160, status: 'LIVE' as const, annualVisitors: 16000000, annualSales: 210000000, currentVisitors: 1420, dwellTime: 63, conversionRate: 21.5, gradientFrom: '#1a3a5c', gradientTo: '#0f2238', primaryColor: '#1a3a5c' },
    { id: 'myyrmanni',  name: 'Myyrmanni',      city: 'Vantaa',   totalShops: 110, status: 'LIVE' as const, annualVisitors: 9800000,  annualSales: 128000000, currentVisitors: 870,  dwellTime: 57, conversionRate: 20.2, gradientFrom: '#3a1a1a', gradientTo: '#240f0f', primaryColor: '#3a1a1a' },
    { id: 'kamppi',     name: 'Kamppi',         city: 'Helsinki', totalShops: 130, status: 'LIVE' as const, annualVisitors: 35000000, annualSales: 420000000, currentVisitors: 3100, dwellTime: 45, conversionRate: 28.0, gradientFrom: '#1a1a3a', gradientTo: '#0f0f24', primaryColor: '#1a1a3a' },
    { id: 'citycenter', name: 'Citycenter',     city: 'Helsinki', totalShops: 85,  status: 'LIVE' as const, annualVisitors: 7200000,  annualSales: 95000000,  currentVisitors: 640,  dwellTime: 48, conversionRate: 19.0, gradientFrom: '#2a1a4a', gradientTo: '#1a0f2e', primaryColor: '#2a1a4a' },
    { id: 'ainoa',      name: 'Ainoa',          city: 'Espoo',    totalShops: 75,  status: 'LIVE' as const, annualVisitors: 6500000,  annualSales: 86000000,  currentVisitors: 580,  dwellTime: 50, conversionRate: 18.5, gradientFrom: '#1a3a2a', gradientTo: '#0f2419', primaryColor: '#1a3a2a' },
    { id: 'entresse',   name: 'Entresse',       city: 'Espoo',    totalShops: 65,  status: 'LIVE' as const, annualVisitors: 5800000,  annualSales: 76000000,  currentVisitors: 520,  dwellTime: 47, conversionRate: 18.0, gradientFrom: '#3a2a1a', gradientTo: '#24190f', primaryColor: '#3a2a1a' },
    { id: 'dixi',       name: 'Dixi',           city: 'Vantaa',   totalShops: 90,  status: 'LIVE' as const, annualVisitors: 8000000,  annualSales: 105000000, currentVisitors: 710,  dwellTime: 53, conversionRate: 19.5, gradientFrom: '#1a2a3a', gradientTo: '#0f1924', primaryColor: '#1a2a3a' },
  ]

  for (const m of realideaMalls) {
    await prisma.mall.create({
      data: {
        id: m.id,
        name: m.name,
        city: m.city,
        totalShops: m.totalShops,
        status: m.status,
        customerId: realidea.id,
        stats: {
          create: {
            currentVisitors: m.currentVisitors,
            annualVisitors: m.annualVisitors,
            annualSales: m.annualSales,
            dwellTime: m.dwellTime,
            conversionRate: m.conversionRate,
          }
        },
        branding: {
          create: {
            primaryColor: m.primaryColor,
            gradientFrom: m.gradientFrom,
            gradientTo: m.gradientTo,
          }
        },
        categories: {
          create: [
            { name: 'Fashion',         shopCount: Math.floor(m.totalShops * 0.30), percentage: 30 },
            { name: 'Food & Beverage', shopCount: Math.floor(m.totalShops * 0.20), percentage: 20 },
            { name: 'Services',        shopCount: Math.floor(m.totalShops * 0.15), percentage: 15 },
            { name: 'Electronics',     shopCount: Math.floor(m.totalShops * 0.10), percentage: 10 },
            { name: 'Home & Living',   shopCount: Math.floor(m.totalShops * 0.10), percentage: 10 },
            { name: 'Sports',          shopCount: Math.floor(m.totalShops * 0.08), percentage: 8  },
            { name: 'Other',           shopCount: Math.floor(m.totalShops * 0.07), percentage: 7  },
          ]
        }
      }
    })
  }
  console.log(`✅ Realidea: ${realideaMalls.length} malls seeded`)

  // ── IDEAPARK ──────────────────────────────────────────────
  const ideapark = await prisma.customer.create({
    data: {
      id: 'ideapark',
      name: 'Ideapark',
      users: {
        create: {
          email: 'admin@ideapark.fi',
          password: await bcrypt.hash('admin123', 10),
          name: 'Ideapark Admin',
          role: 'ADMIN',
        }
      }
    }
  })

  await prisma.mall.create({
    data: {
      id: 'ideapark-lempaala',
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
        }
      },
      branding: {
        create: {
          primaryColor: '#328d2e',
          secondaryColor: '#7cb928',
          accentColor: '#214990',
          gradientFrom: '#264d21',
          gradientTo: '#1a3a15',
        }
      },
      categories: {
        create: [
          { name: 'Fashion',         shopCount: 60, percentage: 30   },
          { name: 'Food & Beverage', shopCount: 40, percentage: 20   },
          { name: 'Auto',            shopCount: 20, percentage: 10   },
          { name: 'Sports',          shopCount: 30, percentage: 15   },
          { name: 'Home & Living',   shopCount: 25, percentage: 12.5 },
          { name: 'Services',        shopCount: 25, percentage: 12.5 },
        ]
      }
    }
  })
  console.log('✅ Ideapark: 1 mall seeded')

  // ── CITYCON ───────────────────────────────────────────────
  const citycon = await prisma.customer.create({
    data: {
      id: 'citycon',
      name: 'Citycon',
      users: {
        create: {
          email: 'admin@citycon.fi',
          password: await bcrypt.hash('admin123', 10),
          name: 'Citycon Admin',
          role: 'ADMIN',
        }
      }
    }
  })

  await prisma.mall.create({
    data: {
      id: 'iso-omena',
      name: 'Iso Omena',
      city: 'Espoo',
      totalShops: 170,
      status: 'LIVE',
      customerId: citycon.id,
      stats: {
        create: {
          currentVisitors: 1600,
          annualVisitors: 14000000,
          annualSales: 195000000,
          dwellTime: 70,
          conversionRate: 22.0,
        }
      },
      branding: {
        create: {
          primaryColor: '#c8102e',
          secondaryColor: '#e63950',
          accentColor: '#ff6b35',
          gradientFrom: '#8b0000',
          gradientTo: '#5a0000',
        }
      },
      categories: {
        create: [
          { name: 'Fashion',         shopCount: 51, percentage: 30 },
          { name: 'Food & Beverage', shopCount: 34, percentage: 20 },
          { name: 'Services',        shopCount: 26, percentage: 15 },
          { name: 'Electronics',     shopCount: 17, percentage: 10 },
          { name: 'Home & Living',   shopCount: 17, percentage: 10 },
          { name: 'Sports',          shopCount: 14, percentage: 8  },
          { name: 'Other',           shopCount: 11, percentage: 7  },
        ]
      }
    }
  })
  console.log('✅ Citycon: 1 mall seeded')

  console.log('🌱 Seeding complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())