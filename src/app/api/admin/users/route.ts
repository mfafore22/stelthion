import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { createUserAndSendWelcome } from '@/lib/email/sendOTP';

/**
 * GET /api/admin/users — List users belonging to the calling admin's customer.
 *
 * Phase B.5 tenant scoping: previously returned all users across all
 * customers. Now filtered to session.user.customerId so a tenant admin
 * cannot see users belonging to other tenants.
 */
export async function GET() {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const users = await prisma.user.findMany({
      where: { customerId: guard.session.user.customerId },
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

/**
 * POST /api/admin/users — Create a user.
 *
 * Phase B.5 tenant scoping: previously honored a client-supplied
 * customerId, allowing a tenant admin to provision users into another
 * tenant. Now the customerId from the body is ignored entirely; the
 * new user is created under the calling admin's customer.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const { email, name, role } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      );
    }

    const result = await createUserAndSendWelcome({
      email,
      name,
      customerId: guard.session.user.customerId,
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
