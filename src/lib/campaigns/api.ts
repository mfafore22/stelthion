import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';

const budget = z.enum(['light', 'standard', 'broad']).default('standard');
const duration = z.enum(['7', '14', '30']).default('14');

export const CampaignSelectionSchema = z.object({
  mallId: z.string().min(1),
  zone: z.string().min(1).default('everyday'),
  audience: z.string().min(1).default('daily'),
  category: z.string().min(1).default('food-beverage'),
  stores: z.array(z.string()).default([]),
  budget,
  duration,
  impact: z.string().optional(),
});

export type CampaignScope =
  | { ok: true; customerId: string; mall: { mallId: string; name: string } }
  | { ok: false; response: NextResponse };

export async function requireCampaignMall(mallId: string): Promise<CampaignScope> {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!session?.user?.id || !customerId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const mall = await prisma.mall.findFirst({
    where: { mallId, customerId },
    select: { mallId: true, name: true },
  });
  if (!mall) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, customerId, mall };
}

export function selectionFromSearchParams(searchParams: URLSearchParams) {
  const stores = searchParams.get('stores')?.split('|').filter(Boolean) ?? [];
  return CampaignSelectionSchema.safeParse({
    mallId: searchParams.get('mallId'),
    zone: searchParams.get('zone') ?? undefined,
    audience: searchParams.get('audience') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    stores,
    budget: searchParams.get('budget') ?? undefined,
    duration: searchParams.get('duration') ?? undefined,
    impact: searchParams.get('impact') ?? undefined,
  });
}

export async function selectionFromRequest(req: Request) {
  const body = await req.json().catch(() => ({}));
  return CampaignSelectionSchema.safeParse(body);
}
