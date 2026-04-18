import type { Prisma } from '../../../node_modules/.prisma/shoppermind-client/index.js';
import { prisma } from '../../db/prisma.js';

type ListArgs = {
  marketId: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  page: number;
  pageSize: number;
};

export async function listReview(args: ListArgs) {
  const where: Prisma.ReviewItemWhereInput = { marketId: args.marketId };
  if (args.status) where.status = args.status;
  const [items, total] = await Promise.all([
    prisma().reviewItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      include: { phenomenon: true },
    }),
    prisma().reviewItem.count({ where }),
  ]);
  return { items, total, page: args.page, pageSize: args.pageSize };
}

type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

export async function approveReview(id: string, userId: string, note?: string): Promise<
  Result<{ reviewItemId: string; signalOfTheDayId: string }>
> {
  const item = await prisma().reviewItem.findUnique({ where: { id } });
  if (!item) return { ok: false, status: 404, error: 'review_item_not_found' };
  if (item.status !== 'PENDING') return { ok: false, status: 409, error: 'already_resolved' };

  const snapshot = item.metricsSnapshot as {
    date?: string;
    country?: string;
    narrative?: string;
  } | null;
  const date = snapshot?.date ? new Date(snapshot.date) : new Date();
  const country = snapshot?.country ?? 'XX';
  const narrative = item.narrativeDraft ?? snapshot?.narrative ?? '';

  const sot = await prisma().signalOfTheDay.upsert({
    where: { marketId_date: { marketId: item.marketId, date } },
    create: {
      marketId: item.marketId,
      country,
      date,
      phenomenonIds: [item.phenomenonId],
      narrative,
    },
    update: {
      phenomenonIds: { set: [item.phenomenonId] },
      narrative,
    },
  });

  await prisma().reviewItem.update({
    where: { id },
    data: {
      status: 'APPROVED',
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNote: note ?? null,
      appliedAction: 'PUBLISHED',
    },
  });

  return { ok: true, value: { reviewItemId: id, signalOfTheDayId: sot.id } };
}

export async function rejectReview(id: string, userId: string, note?: string): Promise<Result<{ reviewItemId: string }>> {
  const item = await prisma().reviewItem.findUnique({ where: { id } });
  if (!item) return { ok: false, status: 404, error: 'review_item_not_found' };
  if (item.status !== 'PENDING') return { ok: false, status: 409, error: 'already_resolved' };
  await prisma().reviewItem.update({
    where: { id },
    data: {
      status: 'REJECTED',
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNote: note ?? null,
      appliedAction: 'REJECTED',
    },
  });
  return { ok: true, value: { reviewItemId: id } };
}
