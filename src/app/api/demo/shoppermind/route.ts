import { NextRequest, NextResponse } from 'next/server';
import { getShopperMindClient } from '@/lib/shoppermind-client';

// Public endpoint — no auth required.
// Uses SHOPPERMIND_DEMO_MARKET_ID (defaults to "helsinki-fi") so the demo
// always shows the seeded Helsinki market without exposing real customer data.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId =
    searchParams.get('marketId') ??
    process.env.SHOPPERMIND_DEMO_MARKET_ID ??
    'helsinki-fi';

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json(
      {
        configured: false,
        marketId,
        market: null,
        phenomena: [],
        signalOfTheDay: null,
      },
      { status: 200 },
    );
  }

  try {
    const [market, phenomenaRes, sotdRes] = await Promise.all([
      client.getMarket(marketId),
      client.listPhenomena({ marketId, limit: 10 }),
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
        configured: false,
        marketId,
        market: null,
        phenomena: [],
        signalOfTheDay: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 200 },
    );
  }
}
