import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';
import {
  shopperMindErrorJson,
  toDashboardPhenomenonDetail,
} from '@/lib/shoppermind-route-adapter';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ error: 'shoppermind_not_configured' }, { status: 503 });
  }

  try {
    const phenomenon = await client.getPhenomenon(id);
    return NextResponse.json(toDashboardPhenomenonDetail(phenomenon));
  } catch (err) {
    return shopperMindErrorJson(err, {});
  }
}
