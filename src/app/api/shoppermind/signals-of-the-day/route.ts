import { defineHandler } from '@/server/api/define-handler';
import prisma from '@/server/db/client';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req }) => {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const limit = Math.min(30, Math.max(1, Number(url.searchParams.get('limit')) || 7));

    const entries = await prisma.signalOfTheDay.findMany({
      where: country ? { country } : undefined,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return entries;
  },
);
