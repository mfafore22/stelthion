import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;
  const { planId } = await req.json();

  const customer = await prisma.customer.update({
    where: { id },
    data: { planId: planId ?? null },
    include: { plan: { select: { id: true, name: true, features: true } } },
  });

  return NextResponse.json(customer);
}
