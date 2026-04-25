import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';
import type { ReviewStatus } from '@stelthion/shoppermind-client-types';

const VALID_STATUS: ReadonlySet<ReviewStatus> = new Set([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]);

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  const marketIdParam = searchParams.get('marketId');
  const statusParam = searchParams.get('status');
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  const marketId = marketIdParam ?? (mallId ? await resolveMarketIdFromMall(mallId) : null);
  if (!marketId) {
    return NextResponse.json({ error: 'marketId or mallId required' }, { status: 400 });
  }

  const status =
    statusParam && VALID_STATUS.has(statusParam as ReviewStatus)
      ? (statusParam as ReviewStatus)
      : undefined;
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
  const pageSize = pageSizeParam ? Math.min(100, Math.max(1, Number(pageSizeParam))) : 25;

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({
      configured: false,
      marketId,
      items: [],
      total: 0,
      page,
      pageSize,
    });
  }

  try {
    const res = await client.listReview({ marketId, status, page, pageSize });
    return NextResponse.json({ configured: true, marketId, ...res });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        marketId,
        items: [],
        total: 0,
        page,
        pageSize,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
