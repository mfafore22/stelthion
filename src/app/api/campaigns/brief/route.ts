import { NextRequest, NextResponse } from 'next/server';
import { requireCampaignMall, selectionFromRequest } from '@/lib/campaigns/api';
import { draftCampaignBrief } from '@/lib/campaigns/workflow';
import { recordTrainingPair } from '@/services/llm-training/store';

export async function POST(req: NextRequest) {
  const language = new URL(req.url).searchParams.get('lang');
  const parsed = await selectionFromRequest(req);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_selection', details: parsed.error.flatten() }, { status: 400 });
  }

  const scope = await requireCampaignMall(parsed.data.mallId);
  if (!scope.ok) return scope.response;

  const draft = draftCampaignBrief(parsed.data, language);
  await recordTrainingPair({
    customerId: scope.customerId,
    mallId: parsed.data.mallId,
    source: 'campaigns:brief-draft',
    language,
    agentRole: 'EVENT_COORDINATOR',
    prompt: JSON.stringify(parsed.data),
    answer: JSON.stringify(draft),
    viewContext: { kind: 'campaign_brief', mall: scope.mall },
  });

  return NextResponse.json({
    sourceMode: 'demo_seed_live_ready',
    mall: scope.mall,
    draft,
  });
}
