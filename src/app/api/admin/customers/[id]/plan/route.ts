import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getActiveCustomer } from '@/lib/admin-customer';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const active = await getActiveCustomer();
  if (!active?.isStelthionAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: only Stelthion admins can change plans' },
      { status: 403 },
    );
  }

  const { id } = await params;
  const { planId } = await req.json();

  const customer = await prisma.customer.update({
    where: { id },
    data: { planId: planId ?? null },
    include: { plan: { select: { id: true, name: true, features: true } } },
  });

  return NextResponse.json(customer);
}
