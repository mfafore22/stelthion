import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Find valid OTP — get the most recent unused one
    const otp = await prisma.emailOtp.findFirst({
      where: {
        email: session.user.email!,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { used: true },
    })

    // Mark 2FA as verified
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorVerifiedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}