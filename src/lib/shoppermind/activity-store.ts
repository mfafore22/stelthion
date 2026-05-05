import prisma from '@/app/lib/prisma';

export interface ShopperMindActivityInput {
  customerId: string;
  mallId: string;
  userId: string;
  eventName: string;
  marketId?: string | null;
  tab?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  categoryIds?: string[];
  metadata?: Record<string, unknown>;
}

type Delegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  findMany: (args: { where: Record<string, unknown>; orderBy: Record<string, string>; take: number }) => Promise<Array<Record<string, unknown>>>;
};

function delegate(): Delegate | null {
  return (prisma as unknown as { shopperMindActivityEvent?: Delegate }).shopperMindActivityEvent ?? null;
}

export async function recordShopperMindActivity(input: ShopperMindActivityInput) {
  const d = delegate();
  if (!d) return;
  await d.create({
    data: {
      ...input,
      categoryIds: input.categoryIds?.length ? input.categoryIds : undefined,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function listShopperMindActivity(customerId: string, since: Date, take = 500) {
  const d = delegate();
  if (!d) return null;
  return d.findMany({
    where: { customerId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
