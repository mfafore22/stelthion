import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getShopperMindClient,
  resolveMarketIdFromCountry,
} from '@/lib/shoppermind-client';
import {
  shopperMindErrorJson,
  toDashboardPhenomenon,
} from '@/lib/shoppermind-route-adapter';
import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const country = url.searchParams.get('country');
  const state = url.searchParams.get('state') as PhenomenonStateValue | null;
  const category = url.searchParams.get('category');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const marketId = url.searchParams.get('marketId') ?? resolveMarketIdFromCountry(country);

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, phenomena: [], total: 0, page, limit });
  }

  try {
    const response = await client.listPhenomena({
      marketId,
      state: state ?? undefined,
      limit: Math.min(100, page * limit),
    });
    const rows = response.phenomena
      .filter((p) => !category || p.categories?.includes(category))
      .map((p) => toDashboardPhenomenon(p, marketId));
    const total = rows.length;
    const phenomena = rows.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ configured: true, phenomena, total, page, limit, marketId });
  } catch (err) {
    return shopperMindErrorJson(err, {
      configured: true,
      phenomena: [],
      total: 0,
      page,
      limit,
      marketId,
    });
  }
}
