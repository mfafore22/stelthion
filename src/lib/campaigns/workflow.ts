import { CAMPAIGN_LABELS, lang } from './labels';
import { estimateCampaign } from './estimate';
import { getTenantCampaignSeed } from '@/lib/shoppermind/tenantImpact';
import {
  SELLO_ANNUAL_SALES_EUR,
  SELLO_ANNUAL_VISITORS,
  type CampaignSelection,
} from './types';

const STEP_IDS = ['brief', 'model', 'approval', 'live', 'learning'];
const LIVE_TOOLS = [
  'brief_context',
  'campaign_estimate',
  'approval_audit',
  'live_tracking',
  'learning_capture',
];

export function getCampaignWorkflow(mallId: string, language?: string | null) {
  const L = CAMPAIGN_LABELS[lang(language)];
  return {
    mallId,
    baseline: { annualVisitors: SELLO_ANNUAL_VISITORS, annualSalesEur: SELLO_ANNUAL_SALES_EUR },
    tools: LIVE_TOOLS,
    steps: L.steps.map(([title, body, demoContent], index) => ({
      id: STEP_IDS[index],
      title,
      body,
      demoContent,
      tool: LIVE_TOOLS[index],
      readyForLive: true,
    })),
  };
}

export function draftCampaignBrief(selection: CampaignSelection, language?: string | null) {
  const L = CAMPAIGN_LABELS[lang(language)];
  return {
    id: `brief-${selection.mallId}-${Date.now()}`,
    title: L.draftTitle,
    body: L.draftBody,
    selection,
    estimate: estimateCampaign(selection, language),
    tenantRoles: tenantRoles(selection, language),
    status: 'draft',
    approvalState: 'not_submitted',
    liveConnectors: ['visitor_counters', 'tenant_pos', 'campaign_channels', 'tenant_feedback'],
    learningCapture: ['prompt', 'answer', 'selected_context', 'manager_feedback', 'result_metrics'],
  };
}

function tenantRoles(selection: CampaignSelection, language?: string | null) {
  const seed = getTenantCampaignSeed(selection.mallId, language);
  const picked = selection.stores.length
    ? seed.stores.filter((store) => selection.stores.includes(store.name))
    : seed.stores.filter((store) => store.categoryIds?.includes(selection.category)).slice(0, 6);

  return picked.slice(0, 8).map((store) => {
    const insight = seed.insights.find((item) => store.insightIds?.includes(item.id));
    return {
      name: store.name,
      category: store.category,
      location: store.location,
      role: insight?.campaignAngle ?? insight?.recommendation ?? '',
      insightId: insight?.id ?? null,
    };
  });
}

export { estimateCampaign };
export type { CampaignSelection, CampaignBudget, CampaignDuration, CampaignEstimate } from './types';
