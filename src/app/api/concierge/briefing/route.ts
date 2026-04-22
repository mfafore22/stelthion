import { z } from 'zod';
import { NextResponse } from 'next/server';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import { generateBriefing } from '@/services/concierge/briefing-generator';

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId required');

    await requireMallOwnership(session, mallId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.conciergeBriefing.findUnique({
      where: {
        mallId_userId_date: {
          mallId,
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (existing) return existing;
    return { briefing: null };
  },
);

export const POST = defineHandler(
  {
    auth: 'session',
    bodySchema: z.object({ mallId: z.string() }),
  },
  async ({ body, auth: session }) => {
    await requireMallOwnership(session, body.mallId);

    const sub = await prisma.conciergeBriefingSubscription.findUnique({
      where: { mallId_userId: { mallId: body.mallId, userId: session.user.id } },
    });

    const sections = sub?.sections
      ? (sub.sections as string[])
      : ['weather', 'footfall', 'events', 'transport'];

    const briefingData = await generateBriefing(body.mallId, sections);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const briefing = await prisma.conciergeBriefing.upsert({
      where: {
        mallId_userId_date: {
          mallId: body.mallId,
          userId: session.user.id,
          date: today,
        },
      },
      create: {
        mallId: body.mallId,
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
  },
);
