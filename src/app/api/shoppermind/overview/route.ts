import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({
      configured: false,
      marketId: resolveMarketIdFromMall(mallId),
      market: null,
      phenomena: [],
      signalOfTheDay: null,
    });
  }

  const marketId = resolveMarketIdFromMall(mallId);
  try {
    const [market, phenomenaRes, sotdRes] = await Promise.all([
      client.getMarket(marketId),
      client.listPhenomena({ marketId, limit: 25 }),
      client.getSignalOfTheDay({ marketId }),
    ]);
    return NextResponse.json({
      configured: true,
      marketId,
      market,
      phenomena: phenomenaRes.phenomena,
      signalOfTheDay: sotdRes.signalOfTheDay,
    });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        marketId,
        market: null,
        phenomena: [],
        signalOfTheDay: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
