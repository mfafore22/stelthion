import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'

export async function PUT(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  try {
    const data = await request.json()

    await prisma.customer.update({
      where: { id: session.user.customerId },
      data: { name: data.companyName },
    })

    const stats = await prisma.stats.update({
      where: { customerId: session.user.customerId },
      data: {
        totalUnits: data.totalUnits,
        topCategory: data.topCategory,
        foodBeverage: data.foodBeverage,
        fashionRetail: data.fashionRetail,
        currentVisitors: data.currentVisitors,
        dwellTime: data.dwellTime,
        conversionRate: data.conversionRate,
      },
    })

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}