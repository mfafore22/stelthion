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
    return NextResponse.json({ configured: false, evidence: null });
  }

  try {
    const evidence = await client.getPhenomenonEvidence(id);
    return NextResponse.json({ configured: true, evidence });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        evidence: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
