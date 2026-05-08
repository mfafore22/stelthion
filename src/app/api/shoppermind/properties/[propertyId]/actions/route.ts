import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await params;
  const marketId = req.nextUrl.searchParams.get('marketId') ?? undefined;
  const client = getShopperMindClient();
  if (!client) {
    return NextResponse.json({ configured: false, actions: null });
  }

  try {
    const actions = await client.getPropertyActions(propertyId, { marketId });
    return NextResponse.json({ configured: true, actions });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        actions: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
