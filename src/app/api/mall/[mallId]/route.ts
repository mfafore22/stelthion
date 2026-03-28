import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mallId } = await params

    // Look up by mallId field, or by customerId (for tenant-scoped requests like /api/mall/ideapark)
    let mall = await prisma.mall.findUnique({
      where: { mallId },
      include: { stats: true, branding: true, categories: true, customer: true },
    })

    if (!mall) {
      // Fallback: find first mall belonging to this customerId
      mall = await prisma.mall.findFirst({
        where: { customerId: mallId },
        include: { stats: true, branding: true, categories: true, customer: true },
      })
    }

    if (!mall) {
      return NextResponse.json({ error: 'Mall not found' }, { status: 404 })
    }

    // Enforce company isolation — users can only access their own malls
    if (mall.customerId !== session.user.customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(mall)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
