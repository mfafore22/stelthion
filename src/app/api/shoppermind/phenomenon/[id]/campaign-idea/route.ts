import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getSessionPlanFeatures } from '@/lib/plan-gate-server';
import { getShopperMindClient, resolveMarketIdFromMall } from '@/lib/shoppermind-client';

const Body = z.object({
  mallId: z.string().min(1),
  language: z.enum(['fi', 'en', 'sv']).optional(),
  angle: z.string().min(1).max(280).optional(),
  audience: z.string().min(1).max(280).optional(),
  budget: z.enum(['light', 'standard', 'premium']).optional(),
  durationDays: z.number().int().min(3).max(60).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const features = await getSessionPlanFeatures(session.user.id);
  if (!features.shoppermind) {
    return NextResponse.json(
      { error: 'feature_not_on_plan', feature: 'shoppermind' },
      { status: 403 },
    );
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
    return NextResponse.json({ configured: false, idea: null });
  }

  const marketId = await resolveMarketIdFromMall(parsed.data.mallId);
  try {
    const res = await client.generateCampaignIdea(id, {
      marketId,
      language: parsed.data.language,
      angle: parsed.data.angle,
      audience: parsed.data.audience,
      budget: parsed.data.budget,
      durationDays: parsed.data.durationDays,
    });
    return NextResponse.json({ configured: true, idea: res.idea });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        idea: null,
        error: err instanceof Error ? err.message : 'service error',
      },
      { status: 502 },
    );
  }
}
