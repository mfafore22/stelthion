import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { ACTIVE_CUSTOMER_COOKIE } from '@/lib/admin-customer';

const Body = z.object({ customerId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { customerId } = parsed.data;
  const homeCustomerId = guard.session.user.customerId;
  const isStelthionAdmin = homeCustomerId === 'ideapark';

  if (!isStelthionAdmin && customerId !== homeCustomerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true },
  });
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CUSTOMER_COOKIE, customer.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ id: customer.id, name: customer.name });
}

export async function DELETE() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CUSTOMER_COOKIE);
  return NextResponse.json({ ok: true });
}
