import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id: customerId } = await params;
  const { mallId, name, city, marketId } = await req.json();

  if (!mallId || !name || !city) {
    return NextResponse.json(
      { error: 'mallId, name, and city are required' },
      { status: 400 },
    );
  }

  const existing = await prisma.mall.findUnique({ where: { mallId } });
  if (existing) {
    return NextResponse.json({ error: `Mall ID "${mallId}" is already taken` }, { status: 409 });
  }

  const mall = await prisma.$transaction(async (tx) => {
    const created = await tx.mall.create({
      data: { mallId, name, city, customerId },
    });
    if (marketId) {
      await tx.mallMarketMapping.create({ data: { mallId, marketId } });
    }
    return created;
  });

  return NextResponse.json(mall, { status: 201 });
}
