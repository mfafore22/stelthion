import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';

export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const active = await getActiveCustomer();
  if (!active?.isStelthionAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: only Stelthion admins can manage plans' },
      { status: 403 },
    );
  }

  let body: { name?: unknown; priceMonthly?: unknown; features?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const priceMonthly =
    body.priceMonthly == null
      ? null
      : typeof body.priceMonthly === 'number' && Number.isFinite(body.priceMonthly)
        ? body.priceMonthly
        : null;

  const features = body.features && typeof body.features === 'object' ? body.features : {};

  try {
    const plan = await prisma.plan.create({
      data: { name, priceMonthly, features: features as Prisma.InputJsonValue },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'A plan with that name already exists' }, { status: 409 });
    }
    throw err;
  }
}
