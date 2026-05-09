import type { MallStatus, PrismaClient } from '@prisma/client'
import { getSelloTenantSummary } from '../src/lib/data/selloTenantMix'

const REALIDEA_PLAN_FEATURES = {
  shoppermind: true,
  edgeVision: true,
  concierge: true,
  spaceAllocation: true,
  venueMind: false,
  maxMalls: 25,
  maxVenues: 1,
}

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

export async function seedRealidea(prisma: PrismaClient) {
  const plan = await prisma.plan.upsert({
    where: { name: 'Realidea Production' },
    update: {
      features: REALIDEA_PLAN_FEATURES,
      priceMonthly: null,
    },
    create: {
      name: 'Realidea Production',
      features: REALIDEA_PLAN_FEATURES,
      priceMonthly: null,
    },
  })

  const customer = await prisma.customer.upsert({
    where: { id: 'realidea-oy' },
    update: { name: 'Realidea Oy', planId: plan.id },
    create: { id: 'realidea-oy', name: 'Realidea Oy', planId: plan.id },
  })

  for (const mall of REALIDEA_MALLS) {
    await prisma.mall.upsert({
      where: { mallId: mall.mallId },
      update: {
        name: mall.name,
        city: mall.city,
        status: mall.status,
        customerId: customer.id,
        ...(mall.totalShops !== undefined ? { totalShops: mall.totalShops } : {}),
      },
      create: {
        mallId: mall.mallId,
        name: mall.name,
        city: mall.city,
        status: mall.status,
        customerId: customer.id,
        totalShops: mall.totalShops ?? 0,
      },
    })
    await prisma.mallMarketMapping.upsert({
      where: { mallId: mall.mallId },
      update: { marketId: 'helsinki-fi' },
      create: { mallId: mall.mallId, marketId: 'helsinki-fi' },
    })
  }

  await seedSelloStub(prisma)
  await seedSelloCategories(prisma)
  return customer
}

async function seedSelloStub(prisma: PrismaClient) {
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
}

async function seedSelloCategories(prisma: PrismaClient) {
  const summary = getSelloTenantSummary()
  for (const cat of summary.topCategories) {
    await prisma.mallCategory.upsert({
      where: { mallId_name: { mallId: 'realidea-sello', name: cat.category } },
      update: { shopCount: cat.count, percentage: cat.percentage },
      create: {
        mallId: 'realidea-sello',
        name: cat.category,
        shopCount: cat.count,
        percentage: cat.percentage,
      },
    })
  }
}
