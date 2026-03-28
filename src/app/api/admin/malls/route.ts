import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/malls — List all malls (for admin sidebar mall selector).
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const malls = await prisma.mall.findMany({
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
