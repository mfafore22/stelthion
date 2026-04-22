import { NextRequest } from 'next/server';
import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';
import type { PhenomenonState } from '@prisma/client';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req }) => {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const state = url.searchParams.get('state') as PhenomenonState | null;
    const category = url.searchParams.get('category');
    const minScore = Number(url.searchParams.get('minScore')) || 0;
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));

    const where = {
      mergedInto: null,
      ...(country ? { primaryCountry: country } : {}),
      ...(state ? { state } : {}),
      ...(category ? { categories: { has: category } } : {}),
    };

    const [phenomena, total] = await Promise.all([
      prisma.phenomenon.findMany({
        where,
        include: {
          scores: {
            where: minScore > 0 ? { compositeScore: { gte: minScore } } : {},
            orderBy: { date: 'desc' },
            take: 28,
          },
          _count: { select: { signals: true, feedback: true } },
        },
        orderBy: { lastSignalAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.phenomenon.count({ where }),
    ]);

    return { phenomena, total, page, limit };
  },
);
