import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getShopperMindClient } from '@/lib/shoppermind-client';

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
    return NextResponse.json({ configured: false, phenomenon: null });
  }

  try {
    const phenomenon = await client.getPhenomenon(id);
    return NextResponse.json({ configured: true, phenomenon });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        phenomenon: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
