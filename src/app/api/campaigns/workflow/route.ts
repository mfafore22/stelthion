import { NextRequest, NextResponse } from 'next/server';
import { requireCampaignMall } from '@/lib/campaigns/api';
import { getCampaignWorkflow } from '@/lib/campaigns/workflow';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const scope = await requireCampaignMall(mallId);
  if (!scope.ok) return scope.response;

  return NextResponse.json({
    sourceMode: 'demo_seed_live_ready',
    mall: scope.mall,
    ...getCampaignWorkflow(mallId, searchParams.get('lang')),
  });
}
