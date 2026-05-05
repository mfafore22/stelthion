import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { recordShopperMindActivity } from '@/lib/shoppermind/activity-store';

const Body = z.object({
  mallId: z.string().min(1),
  eventName: z.string().min(1).max(80),
  marketId: z.string().max(80).optional(),
  tab: z.string().max(80).optional(),
  entityType: z.string().max(80).optional(),
  entityId: z.string().max(160).optional(),
  entityLabel: z.string().max(300).optional(),
  categoryIds: z.array(z.string().max(80)).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!session?.user?.id || !customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const mall = await prisma.mall.findFirst({
    where: { mallId: parsed.data.mallId, customerId },
    select: { mallId: true },
  });
  if (!mall) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await recordShopperMindActivity({
    ...parsed.data,
    customerId,
    userId: session.user.id,
  });
  return NextResponse.json({ ok: true });
}
