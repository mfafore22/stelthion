import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  try {
    const { mallId } = await params
    const mall = await prisma.mall.findUnique({
      where: { id: mallId },
      include: {
        stats: true,
        branding: true,
        categories: true,
        customer: true,
      }
    })

    if (!mall) {
      return NextResponse.json({ error: 'Mall not found' }, { status: 404 })
    }

    return NextResponse.json(mall)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}