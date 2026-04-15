import { NextRequest, NextResponse } from 'next/server';
import { runClustering } from '@/services/shoppermind/clustering';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expected = process.env.SHOPPERMIND_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await runClustering();
  return NextResponse.json(summary);
}
