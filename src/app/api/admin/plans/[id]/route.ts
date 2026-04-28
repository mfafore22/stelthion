import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const active = await getActiveCustomer();
  if (!active?.isStelthionAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: only Stelthion admins can manage plans' },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: { name?: unknown; priceMonthly?: unknown; features?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Prisma.PlanUpdateInput = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    data.name = name;
  }

  if ('priceMonthly' in body) {
    if (body.priceMonthly == null) {
      data.priceMonthly = null;
    } else if (typeof body.priceMonthly === 'number' && Number.isFinite(body.priceMonthly)) {
      data.priceMonthly = body.priceMonthly;
    } else {
      return NextResponse.json({ error: 'priceMonthly must be a number or null' }, { status: 400 });
    }
  }

  if ('features' in body) {
    if (!body.features || typeof body.features !== 'object') {
      return NextResponse.json({ error: 'features must be an object' }, { status: 400 });
    }
    data.features = body.features as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
    const plan = await prisma.plan.update({ where: { id }, data });
    return NextResponse.json(plan);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      if (err.code === 'P2002') {
        return NextResponse.json({ error: 'A plan with that name already exists' }, { status: 409 });
      }
    }
    throw err;
  }
}
