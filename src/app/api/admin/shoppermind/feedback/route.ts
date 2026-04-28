import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';
import { getShopperMindClient } from '@/lib/shoppermind-client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const active = await getActiveCustomer();
  if (!active) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, rows: [], aggregates: [] });
  }

  const allowedMarkets = active.isStelthionAdmin
    ? null
    : (
        await prisma.mallMarketMapping.findMany({
          where: { mall: { customerId: active.id } },
          select: { marketId: true },
        })
      ).map((m) => m.marketId);

  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get('limit');
  const limitNum = limitRaw ? Number(limitRaw) : undefined;
  const requestedMarketId = searchParams.get('marketId') ?? undefined;

  if (allowedMarkets) {
    if (requestedMarketId && !allowedMarkets.includes(requestedMarketId)) {
      return NextResponse.json(
        { error: 'Forbidden: marketId not in active customer' },
        { status: 403 },
      );
    }
    if (allowedMarkets.length === 0) {
      return NextResponse.json({ configured: true, rows: [], aggregates: [] });
    }
  }

  try {
    const list = await client.listFeedback({
      phenomenonId: searchParams.get('phenomenonId') ?? undefined,
      verdict: searchParams.get('verdict') ?? undefined,
      marketId: requestedMarketId,
      since: searchParams.get('since') ?? undefined,
      limit: Number.isFinite(limitNum) ? limitNum : undefined,
    });
    const rows = allowedMarkets
      ? (list.rows ?? []).filter((r) => r.marketId !== null && allowedMarkets.includes(r.marketId))
      : list.rows;
    return NextResponse.json({ configured: true, rows, aggregates: list.aggregates });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        rows: [],
        aggregates: [],
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
