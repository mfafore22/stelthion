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
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorVerifiedAt: null,
    },
  })

  return NextResponse.json({ success: true })
}