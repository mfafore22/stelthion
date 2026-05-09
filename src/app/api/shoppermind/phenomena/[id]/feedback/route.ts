import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';
import { shopperMindErrorJson } from '@/lib/shoppermind-route-adapter';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const body = (await req.json()) as {
    verdict: string;
    note?: string;
    userId: string;
    marketId?: string;
  };

  if (!body.verdict || !body.userId) {
    return NextResponse.json({ error: 'verdict and userId required' }, { status: 400 });
  }

  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ error: 'shoppermind_not_configured' }, { status: 503 });
  }

  try {
    const feedback = await client.recordFeedback(id, {
      userId: body.userId,
      marketId: body.marketId,
      interactionKind: 'thumbs',
      verdict: body.verdict,
      note: body.note,
    });
    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    return shopperMindErrorJson(err, {});
  }
}
