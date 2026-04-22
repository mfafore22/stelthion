import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { recalculateWeights } from '@/services/shoppermind/weights';

export const POST = defineHandler(
  {
    auth: 'admin',
    paramsSchema: z.object({ id: z.string() }),
    bodySchema: z.object({
      verdict: z.string(),
      note: z.string().optional(),
    }),
  },
  async ({ params, body, auth: session }) => {
    const phenomenon = await prisma.phenomenon.findUnique({ where: { id: params.id } });
    if (!phenomenon) throw new HttpError(404, 'Not found');

    const feedback = await prisma.phenomenonFeedback.create({
      data: {
        phenomenonId: params.id,
        userId: session.user.id,
        verdict: body.verdict,
        note: body.note,
      },
    });

    recalculateWeights(phenomenon.primaryCountry).catch(() => {});

    return feedback;
  },
);
