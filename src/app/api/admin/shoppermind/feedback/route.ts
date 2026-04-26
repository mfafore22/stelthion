import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, rows: [], aggregates: [] });
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get('limit');
  const limitNum = limitRaw ? Number(limitRaw) : undefined;

  try {
    const list = await client.listFeedback({
      phenomenonId: searchParams.get('phenomenonId') ?? undefined,
      verdict: searchParams.get('verdict') ?? undefined,
      marketId: searchParams.get('marketId') ?? undefined,
      since: searchParams.get('since') ?? undefined,
      limit: Number.isFinite(limitNum) ? limitNum : undefined,
    });
    return NextResponse.json({ configured: true, ...list });
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
