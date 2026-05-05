import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { getTenantCampaignSeed } from '@/lib/shoppermind/tenantImpact';

export async function GET(req: NextRequest) {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!session?.user?.id || !customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  if (!mallId) return NextResponse.json({ error: 'mallId required' }, { status: 400 });

  const mall = await prisma.mall.findFirst({
    where: { mallId, customerId },
    select: { mallId: true },
  });
  if (!mall) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({
    mallId,
    sourceMode: 'demo_seed_live_ready',
    ...getTenantCampaignSeed(mallId, searchParams.get('lang')),
  });
}
