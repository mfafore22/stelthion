import { textKey, type AgentDefinition } from '@stelthion/intelligence-runtime';
import { shopperMindToolDefinitions } from './tools.js';

const overviewTool = 'shoppermind.market_overview.read';
const retrievalTool = 'shoppermind.retrieval.search';
const campaignTool = 'shoppermind.campaign_idea.create';
const imfMacroTool = 'imf.macro_context.read';

export const shopperMindAgentDefinitions: AgentDefinition[] = [
  {
    id: 'shoppermind.trend_analyst',
    domain: 'shoppermind',
    label: textKey('shoppermind.agents.trendAnalyst.label'),
    description: textKey('shoppermind.agents.trendAnalyst.description'),
    capabilities: [{
      id: 'trend-analysis',
      taskTypes: ['analysis', 'chat'],
      intents: ['query_data', 'analyze_trends', 'compare_metrics', 'predict'],
      requiredToolIds: [overviewTool, retrievalTool],
    }],
    allowedToolIds: [overviewTool, retrievalTool, imfMacroTool],
    memoryTiers: ['fresh_signal', 'retrieval', 'ui_cache'],
    validation: [
      { kind: 'source_trust', required: true, blockerOnFailure: true },
      { kind: 'source_count', required: true },
      { kind: 'freshness', required: true },
    ],
    outputContract: { name: 'ShopperMindInsightAnswer', version: '1' },
    scopeConstraints: ['customerId', 'marketId'],
    routing: {
      keywords: ['trend', 'signal', 'shopper', 'market', 'campaign', 'demand'],
    },
  },
  {
    id: 'shoppermind.campaign_planner',
    domain: 'shoppermind',
    label: textKey('shoppermind.agents.campaignPlanner.label'),
    capabilities: [{
      id: 'campaign-planning',
      taskTypes: ['planning'],
      intents: ['plan_event', 'optimize', 'generate_report'],
      requiredToolIds: [campaignTool, retrievalTool],
    }],
    allowedToolIds: [campaignTool, retrievalTool],
    memoryTiers: ['verified_evidence', 'retrieval', 'ui_cache'],
    validation: [{ kind: 'sensitive_claim', required: true, blockerOnFailure: true }],
    outputContract: { name: 'ShopperMindCampaignPlan', version: '1' },
    scopeConstraints: ['customerId', 'marketId'],
    routing: { keywords: ['campaign', 'activation', 'promotion', 'tenant'] },
  },
];

export const shopperMindAgentToolIds = shopperMindToolDefinitions.map((tool) => tool.id);
