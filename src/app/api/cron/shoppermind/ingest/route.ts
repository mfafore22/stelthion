import { NextRequest, NextResponse } from 'next/server';
import { getShopperMindInternalClient } from '@/lib/shoppermind-client';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expected = process.env.SHOPPERMIND_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    markets?: string[];
  };

  const client = getShopperMindInternalClient();
  if (!client) {
    return NextResponse.json({ error: 'shoppermind_not_configured' }, { status: 503 });
  }

  const summary = await client.runCron({ stages: ['ingest'], markets: body.markets });
  return NextResponse.json(summary);
}
