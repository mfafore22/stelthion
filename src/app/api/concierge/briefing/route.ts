import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { generateBriefing } from '@/services/concierge/briefing-generator';
import { resolveScopedMall } from '@/lib/customer-scope/requireMallScope';

/** GET — Fetch today's briefing for the current user */
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
  const scope = await resolveScopedMall(mallId);
  if (scope.error) return scope.error;
  const scopedMallId = scope.mall!.mallId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.conciergeBriefing.findUnique({
    where: {
      mallId_userId_date: {
        mallId: scopedMallId,
        userId: session.user.id,
        date: today,
      },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  return NextResponse.json({ briefing: null });
}

/** POST — Generate a briefing on demand */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { mallId } = body;

  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }
  const scope = await resolveScopedMall(mallId);
  if (scope.error) return scope.error;
  const scopedMallId = scope.mall!.mallId;

  // Check subscription for section preferences
  const sub = await prisma.conciergeBriefingSubscription.findUnique({
    where: { mallId_userId: { mallId: scopedMallId, userId: session.user.id } },
  });

  const sections = sub?.sections
    ? (sub.sections as string[])
    : ['weather', 'footfall', 'events', 'transport'];

  const briefingData = await generateBriefing(scopedMallId, sections);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const briefing = await prisma.conciergeBriefing.upsert({
    where: {
      mallId_userId_date: {
        mallId: scopedMallId,
        userId: session.user.id,
        date: today,
      },
    },
    create: {
      mallId: scopedMallId,
      userId: session.user.id,
      date: today,
      content: JSON.parse(JSON.stringify(briefingData)),
      sentAt: new Date(),
    },
    update: {
      content: JSON.parse(JSON.stringify(briefingData)),
      sentAt: new Date(),
    },
  });

  return NextResponse.json(briefing, { status: 201 });
}
