import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getShopperMindClient,
  resolveMarketIdFromCountry,
} from '@/lib/shoppermind-client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const country = url.searchParams.get('country');
  const marketId = url.searchParams.get('marketId') ?? resolveMarketIdFromCountry(country);
  const client = getShopperMindClient();

  if (!client) {
    return NextResponse.json([]);
  }

  try {
    const response = await client.getSignalOfTheDay({ marketId });
    return NextResponse.json(response.signalOfTheDay ? [response.signalOfTheDay] : []);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
