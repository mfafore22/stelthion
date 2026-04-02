import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { createUserAndSendWelcome } from '@/lib/email/sendOtp';

export async function GET() {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const { email, name, customerId, role } = await req.json();

    if (!email || !name || !customerId) {
      return NextResponse.json(
        { error: 'email, name, and customerId are required' },
        { status: 400 }
      );
    }

    const result = await createUserAndSendWelcome({
      email,
      name,
      customerId,
      role: role || 'USER',
    });

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      message: `Welcome email sent to ${email}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}