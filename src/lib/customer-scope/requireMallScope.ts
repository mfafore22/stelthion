import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { currentUserMallIds } from '@/lib/admin-customer';
import { canonicalizeMallId } from '@/lib/mall/ids';

export interface ScopedMall {
  mallId: string;
  customerId: string;
}

export async function resolveScopedMall(
  requestedMallId: string,
): Promise<{ mall?: ScopedMall; error?: NextResponse }> {
  const allowedMallIds = await currentUserMallIds();
  if (!allowedMallIds) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const canonicalMallId = canonicalizeMallId(requestedMallId);
  if (!canonicalMallId) {
    return { error: NextResponse.json({ error: `Mall not found: ${requestedMallId}` }, { status: 404 }) };
  }

  const mall = await prisma.mall.findUnique({
    where: { mallId: canonicalMallId },
    select: { mallId: true, customerId: true },
  });

  if (!mall) {
    return { error: NextResponse.json({ error: `Mall not found: ${requestedMallId}` }, { status: 404 }) };
  }
  if (!allowedMallIds.includes(mall.mallId)) {
    return { error: NextResponse.json({ error: 'Forbidden: mall not in customer scope' }, { status: 403 }) };
  }
  return { mall };
}
