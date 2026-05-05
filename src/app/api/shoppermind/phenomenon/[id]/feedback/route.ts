import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';
import { recordTrainingPair } from '@/services/llm-training/store';

const Body = z.object({
  mallId: z.string().min(1).optional(),
  verdict: z.enum(['relevant', 'not_relevant']),
  note: z.string().max(2000).optional(),
  entityType: z.string().max(80).optional(),
  entityLabel: z.string().max(300).optional(),
  categoryIds: z.array(z.string().max(80)).max(20).optional(),
  reasonCodes: z.array(z.string().max(80)).max(12).optional(),
  promptContext: z.string().max(4000).optional(),
  generatedAnswer: z.string().max(8000).optional(),
  language: z.string().max(12).optional(),
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
    await recordFeedbackTrainingCandidate({
      customerId: (session.user as { customerId?: string }).customerId,
      mallId: parsed.data.mallId,
      phenomenonId: id,
      userId: session.user.id,
      input: parsed.data,
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

async function recordFeedbackTrainingCandidate({
  customerId,
  mallId,
  phenomenonId,
  userId,
  input,
}: {
  customerId?: string;
  mallId?: string;
  phenomenonId: string;
  userId: string;
  input: z.infer<typeof Body>;
}) {
  if (!customerId || !mallId) return;
  const label = input.entityLabel ?? phenomenonId;
  const prompt = input.promptContext?.trim()
    || `User feedback for ShopperMind ${input.entityType ?? 'trend'}: ${label}`;
  const answer = input.generatedAnswer?.trim()
    || JSON.stringify({
      verdict: input.verdict,
      comment: input.note ?? null,
      reasonCodes: input.reasonCodes ?? [],
    });
  await recordTrainingPair({
    customerId,
    mallId,
    source: 'shoppermind.feedback',
    language: input.language ?? null,
    agentRole: 'feedback-loop',
    prompt,
    answer,
    viewContext: {
      entityType: input.entityType ?? 'trend',
      entityId: phenomenonId,
      entityLabel: input.entityLabel ?? null,
      categoryIds: input.categoryIds ?? [],
      reasonCodes: input.reasonCodes ?? [],
      userVerdict: input.verdict,
      userComment: input.note ?? null,
      trainingStatus: 'candidate',
      userId,
    },
  });
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
