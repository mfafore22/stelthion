import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getShopperMindClient,
  resolveMarketIdFromCountry,
} from '@/lib/shoppermind-client';
import { toDashboardPhenomenon } from '@/lib/shoppermind-route-adapter';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const country = url.searchParams.get('country');
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 10));
  const marketId = url.searchParams.get('marketId') ?? resolveMarketIdFromCountry(country);

  if (!query) return NextResponse.json({ error: 'q parameter required' }, { status: 400 });

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json([]);
  }

  const needle = query.toLowerCase();
  const response = await client.listPhenomena({ marketId, limit: 100 });

  const scored = response.phenomena
    .map((p) => {
      const haystack = [
        p.label,
        p.description,
        ...(p.categories ?? []),
        ...(p.keywords ?? []),
      ].join(' ').toLowerCase();
      return {
        ...toDashboardPhenomenon(p, marketId),
        similarity: haystack.includes(needle) ? 1 : 0,
      };
    })
    .filter((p) => p.similarity > 0)
    .slice(0, limit);

  return NextResponse.json(scored);
}
