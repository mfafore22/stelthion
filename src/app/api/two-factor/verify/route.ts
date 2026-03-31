import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'
import { verifyOTP } from '@/lib/email/sendOtp'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const valid = await verifyOTP(session.user.email!, code)

  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorVerifiedAt: new Date() },
  })

  // Get user info for the client to decide redirect
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, customerId: true },
  })

  // Calculate the mall redirect (for when client chooses mall login)
  let mallRedirectTo = '/dashboard'

  if (user?.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: user.customerId },
      include: { malls: { select: { mallId: true } } },
    })

    if (customer?.malls && customer.malls.length > 0) {
      if (customer.malls.length === 1) {
        mallRedirectTo = `/mall/${customer.malls[0].mallId}`
      } else {
        const tenantSlug = customer.name.toLowerCase().replace(/\s+/g, '-')
        mallRedirectTo = `/tenant/${tenantSlug}/portfolio`
      }
    }
  }

  return NextResponse.json({
    success: true,
    verified: true,
    role: user?.role ?? 'USER',
    mallRedirectTo,
  })
}
