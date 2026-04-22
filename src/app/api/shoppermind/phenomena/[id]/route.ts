import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';

export const GET = defineHandler(
  {
    auth: 'admin',
    paramsSchema: z.object({ id: z.string() }),
  },
  async ({ params }) => {
    const phenomenon = await prisma.phenomenon.findUnique({
      where: { id: params.id },
      include: {
        scores: { orderBy: { date: 'desc' }, take: 28 },
        signals: {
          orderBy: { publishedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            url: true,
            publishedAt: true,
            source: { select: { name: true, type: true } },
          },
        },
        feedback: { orderBy: { createdAt: 'desc' }, take: 50 },
        _count: { select: { signals: true, feedback: true } },
      },
    });

    if (!phenomenon) throw new HttpError(404, 'Not found');
    return phenomenon;
  },
);
