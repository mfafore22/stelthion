import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

/** GET — Fetch user's briefing subscription */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');

  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const sub = await prisma.conciergeBriefingSubscription.findUnique({
    where: { mallId_userId: { mallId, userId: session.user.id } },
  });

  return NextResponse.json(sub || { enabled: false, timeUtc: '06:00', sections: ['weather', 'footfall', 'events', 'transport'] });
}

/** PUT — Create or update subscription */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { mallId, enabled, timeUtc, sections } = body;

  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const sub = await prisma.conciergeBriefingSubscription.upsert({
    where: { mallId_userId: { mallId, userId: session.user.id } },
    create: {
      mallId,
      userId: session.user.id,
      enabled: enabled ?? true,
      timeUtc: timeUtc ?? '06:00',
      sections: sections ?? ['weather', 'footfall', 'events', 'transport'],
    },
    update: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(timeUtc ? { timeUtc } : {}),
      ...(sections ? { sections } : {}),
    },
  });

  return NextResponse.json(sub);
}
