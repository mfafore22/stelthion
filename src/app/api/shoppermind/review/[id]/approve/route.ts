import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;
  const { session } = gate;

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { note?: string };

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ error: 'ShopperMind service not configured' }, { status: 503 });
  }

  try {
    const res = await client.approveReviewItem(id, {
      userId: session.user.id ?? session.user.email ?? 'unknown',
      note: body.note,
    });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'service error' },
      { status: 502 },
    );
  }
}
