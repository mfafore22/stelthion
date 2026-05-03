import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';
import { toFineTuneJsonl } from '@/services/llm-training/export';
import { TRAINING_PAIR_TARGET } from '@/services/llm-training/store';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const active = await getActiveCustomer();
  if (!active) return NextResponse.json({ error: 'No active customer' }, { status: 409 });

  const rows = await prisma.llmTrainingPair.findMany({
    where: { customerId: active.id },
    orderBy: { createdAt: 'asc' },
    take: TRAINING_PAIR_TARGET,
  });

  const body = rows.map(toFineTuneJsonl).join('\n');
  const safeName = active.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return new NextResponse(body + (body ? '\n' : ''), {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}-llm-training.jsonl"`,
      'X-Training-Pair-Count': String(rows.length),
      'X-Training-Pair-Target': String(TRAINING_PAIR_TARGET),
    },
  });
}
