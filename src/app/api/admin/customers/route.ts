import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';

export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const active = await getActiveCustomer();
  if (!active) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  const customers = await prisma.customer.findMany({
    where: active.isStelthionAdmin ? undefined : { id: active.id },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: { select: { id: true, name: true, features: true } },
      _count: { select: { malls: true, users: true } },
    },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const active = await getActiveCustomer();
  if (!active?.isStelthionAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: only Stelthion admins can create customers' },
      { status: 403 },
    );
  }

  const { name, planId } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: { name, planId: planId || null },
    include: { plan: { select: { id: true, name: true } } },
  });

  return NextResponse.json(customer, { status: 201 });
}
