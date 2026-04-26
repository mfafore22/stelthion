import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';

const Body = z.object({
  mallId: z.string().min(1).optional(),
  verdict: z.enum(['relevant', 'not_relevant']),
  note: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, row: null });
  }

  const marketId = parsed.data.mallId
    ? await resolveMarketIdFromMall(parsed.data.mallId)
    : undefined;

  try {
    const row = await client.recordFeedback(id, {
      userId: session.user.id,
      marketId,
      interactionKind: 'thumbs',
      verdict: parsed.data.verdict,
      note: parsed.data.note,
    });
    return NextResponse.json({ configured: true, row });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        row: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, row: null });
  }

  try {
    const list = await client.listFeedback({
      phenomenonId: id,
      userId: session.user.id,
      limit: 1,
    });
    return NextResponse.json({ configured: true, row: list.rows[0] ?? null });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        row: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
