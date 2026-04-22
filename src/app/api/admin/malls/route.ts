import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/malls — List malls for the admin sidebar mall selector.
 *
 * Phase B.5 tenant scoping: previously returned every mall across every
 * customer. Now filtered to session.user.customerId so a tenant admin
 * only sees their own malls in the selector.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const malls = await prisma.mall.findMany({
    where: { customerId: guard.session.user.customerId },
    orderBy: { name: 'asc' },
    select: {
      mallId: true,
      name: true,
      city: true,
      status: true,
    },
  });

  return NextResponse.json(malls);
}
