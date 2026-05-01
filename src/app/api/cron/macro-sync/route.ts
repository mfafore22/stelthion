import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { syncAllIndicators } from '@/lib/shoppermind/sync-macro';

// Cron-triggered macro sync. Vercel cron sends an Authorization header
// "Bearer <CRON_SECRET>". GET is also accepted because Vercel cron uses GET.
// Locally testable via:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/macro-sync

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const only = url.searchParams.get('only') ?? undefined;
  const summary = await syncAllIndicators(prisma, only);
  return NextResponse.json({
    ok: summary.ok,
    failed: summary.failed,
    results: summary.results,
  });
}

export const GET = run;
export const POST = run;
