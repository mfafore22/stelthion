import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';
import { getSessionPlanFeatures } from '@/lib/plan-gate-server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const features = await getSessionPlanFeatures(session.user.id);
  if (!features.shoppermind) {
    return NextResponse.json(
      { error: 'feature_not_on_plan', feature: 'shoppermind' },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  const language = searchParams.get('language') ?? searchParams.get('lang') ?? undefined;
  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const marketId = await resolveMarketIdFromMall(mallId);
  const client = getShopperMindClient();
  if (!client) {
    return shopperMindUnavailable(marketId);
  }
  try {
    const overview = await client.getMarketOverview(marketId);
    const actions = await client.getPropertyActions(mallId, { marketId, language }).catch(() => null);
    return NextResponse.json({
      configured: true,
      marketId,
      market: overview.market,
      phenomena: overview.phenomena,
      signalOfTheDay: overview.signalOfTheDay,
      materializedAt: overview.materializedAt,
      expiresAt: overview.expiresAt,
      freshness: overview.freshness,
      propertyActions: actions,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      return shopperMindUnavailable(marketId);
    }
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

function shopperMindUnavailable(marketId: string) {
  const localFallback =
    process.env.NODE_ENV !== 'production' &&
    process.env.SHOPPERMIND_ALLOW_LOCAL_FALLBACK !== 'false';
  return NextResponse.json(
    {
      configured: false,
      localFallback,
      marketId,
      market: null,
      phenomena: [],
      signalOfTheDay: null,
      error: localFallback ? undefined : 'shoppermind_service_not_configured',
    },
    { status: localFallback ? 200 : 503 },
  );
}
