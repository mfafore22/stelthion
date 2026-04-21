import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/app/lib/prisma'
import { generateAndSendOTP, maskEmail } from '@/lib/email/sendOTP'

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorVerifiedAt: true },
  })

  if (user?.twoFactorVerifiedAt) {
    return NextResponse.json({ alreadyVerified: true })
  }

  try {
    await generateAndSendOTP(session.user.email)

    return NextResponse.json({
      success: true,
      sent: true,
      emailHint: maskEmail(session.user.email),
    })
  } catch (error) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
