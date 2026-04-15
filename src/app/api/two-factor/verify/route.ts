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

    // Get user with lockout fields
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        failedOtpAttempts: true,
        otpLockedUntil: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if OTP is locked
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.otpLockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      )
    }

    // Find valid OTP
    const otp = await prisma.emailOtp.findFirst({
      where: {
        email: user.email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      // Wrong OTP — increment attempts
      const attempts = user.failedOtpAttempts + 1

      if (attempts >= 2) {
        // Lock OTP for 10 minutes
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedOtpAttempts: 0,
            otpLockedUntil: new Date(Date.now() + 10 * 60 * 1000),
          },
        })
        return NextResponse.json(
          { error: 'Too many attempts. Request a new code in 10 minutes.' },
          { status: 429 }
        )
      }

      // Not locked yet — just increment
      await prisma.user.update({
        where: { id: user.id },
        data: { failedOtpAttempts: attempts },
      })

      return NextResponse.json(
        { error: `Invalid code. ${2 - attempts} attempt remaining.` },
        { status: 400 }
      )
    }

    // Correct OTP — mark used, reset attempts, verify 2FA
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { used: true },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorVerifiedAt: new Date(),
        failedOtpAttempts: 0,
        otpLockedUntil: null,
      },
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