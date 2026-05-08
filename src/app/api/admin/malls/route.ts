import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';

/**
 * GET /api/admin/malls — List malls for the currently-active customer.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const active = await getActiveCustomer();
  if (!active) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  const malls = await prisma.mall.findMany({
    where: { customerId: active.id },
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
