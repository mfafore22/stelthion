import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId required');

    await requireMallOwnership(session, mallId);

    const sub = await prisma.conciergeBriefingSubscription.findUnique({
      where: { mallId_userId: { mallId, userId: session.user.id } },
    });

    return sub || { enabled: false, timeUtc: '06:00', sections: ['weather', 'footfall', 'events', 'transport'] };
  },
);

export const PUT = defineHandler(
  {
    auth: 'session',
    bodySchema: z.object({
      mallId: z.string(),
      enabled: z.boolean().optional(),
      timeUtc: z.string().optional(),
      sections: z.array(z.string()).optional(),
    }),
  },
  async ({ body, auth: session }) => {
    await requireMallOwnership(session, body.mallId);

    const sub = await prisma.conciergeBriefingSubscription.upsert({
      where: { mallId_userId: { mallId: body.mallId, userId: session.user.id } },
      create: {
        mallId: body.mallId,
        userId: session.user.id,
        enabled: body.enabled ?? true,
        timeUtc: body.timeUtc ?? '06:00',
        sections: body.sections ?? ['weather', 'footfall', 'events', 'transport'],
      },
      update: {
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.timeUtc ? { timeUtc: body.timeUtc } : {}),
        ...(body.sections ? { sections: body.sections } : {}),
      },
    });

    return sub;
  },
);
