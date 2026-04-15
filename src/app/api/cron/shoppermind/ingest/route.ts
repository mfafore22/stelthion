import { NextRequest, NextResponse } from 'next/server';
import { runIngestion } from '@/services/shoppermind/ingest-runner';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expected = process.env.SHOPPERMIND_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    sourceIds?: string[];
    force?: boolean;
  };

  const summary = await runIngestion(body);
  return NextResponse.json(summary);
}
