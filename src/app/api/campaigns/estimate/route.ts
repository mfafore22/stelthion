import { NextRequest, NextResponse } from 'next/server';
import { requireCampaignMall, selectionFromSearchParams } from '@/lib/campaigns/api';
import { estimateCampaign } from '@/lib/campaigns/workflow';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = selectionFromSearchParams(searchParams);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_selection', details: parsed.error.flatten() }, { status: 400 });
  }

  const scope = await requireCampaignMall(parsed.data.mallId);
  if (!scope.ok) return scope.response;

  return NextResponse.json({
    sourceMode: 'demo_seed_live_ready',
    mall: scope.mall,
    ...estimateCampaign(parsed.data, searchParams.get('lang')),
  });
}
