import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { parsePlanFeatures, type PlanFeatures } from '@/lib/plan-gate';

const DEFAULT_FEATURES: PlanFeatures = {
  shoppermind: false,
  edgeVision: false,
  concierge: false,
  spaceAllocation: false,
  venueMind: false,
  maxMalls: 1,
  maxVenues: 1,
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(DEFAULT_FEATURES);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customerId: true },
  });
  if (!user?.customerId) {
    return NextResponse.json(DEFAULT_FEATURES);
  }

  const customer = await prisma.customer.findUnique({
    where: { id: user.customerId },
    select: { plan: { select: { features: true } } },
  });

  return NextResponse.json(parsePlanFeatures(customer?.plan?.features));
}
