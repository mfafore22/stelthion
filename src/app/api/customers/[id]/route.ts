import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/auth'
import { sortCustomerMalls } from '@/lib/mall/primaryMall'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (session.user.customerId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        malls: {
          include: {
            stats: true,
            branding: true,
            categories: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const venues = await prisma.$queryRaw`
      SELECT "venueId", "name", "city", "country", "capacity", "annualVisitors", "annualEvents", "status"
      FROM "Venue"
      WHERE "customerId" = ${id}
      ORDER BY "name" ASC
    `

    return NextResponse.json({
      ...customer,
      malls: sortCustomerMalls(customer.malls, customer.id),
      venues,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
