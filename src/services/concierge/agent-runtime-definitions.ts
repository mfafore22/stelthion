import {
  textKey,
  type AgentDefinition,
  type AgentTaskIntent,
  type RuntimeToolDefinition,
} from '@stelthion/intelligence-runtime';
import { AgentRole } from '@/lib/gcm-types';
import { DomainType } from './types';

export interface ConciergeAgentMetadata {
  agentRole: AgentRole;
  domainType: DomainType;
}

export const conciergeToolDefinitions: RuntimeToolDefinition[] = [
  tool('concierge.sales.read', 'shoppermind', 'concierge.tools.sales'),
  tool('concierge.footfall.read', 'shoppermind', 'concierge.tools.footfall'),
  tool('concierge.parking.read', 'shoppermind', 'concierge.tools.parking'),
  tool('concierge.events.read', 'campaigns', 'concierge.tools.events'),
  tool('concierge.campaign.plan', 'campaigns', 'concierge.tools.campaign'),
  tool('shoppermind.retrieval.search', 'shoppermind', 'concierge.tools.retrieval'),
  tool('venuemind.venue_brief.read', 'venuemind', 'concierge.tools.venueBrief'),
];

export const conciergeAgentDefinitions: AgentDefinition[] = [
  agent('concierge.sales_optimizer', 'shoppermind', AgentRole.SALES_OPTIMIZER, DomainType.SALES, [
    'concierge.sales.read',
    'shoppermind.retrieval.search',
  ], ['query_data', 'compare_metrics', 'generate_report', 'optimize'], [
    'sales', 'revenue', 'income', 'turnover', 'myynti', 'liikevaihto', 'profit', 'transaction', 'volume',
  ]),
  agent('concierge.footfall_analyst', 'shoppermind', AgentRole.FOOTFALL_ANALYST, DomainType.FOOTFALL, [
    'concierge.footfall.read',
    'shoppermind.retrieval.search',
  ], ['query_data', 'analyze_trends', 'predict', 'optimize'], [
    'footfall', 'visitor', 'visitors', 'visited', 'traffic', 'flow', 'kävijä', 'people', 'peak',
  ]),
  agent('concierge.event_coordinator', 'campaigns', AgentRole.EVENT_COORDINATOR, DomainType.EVENTS, [
    'concierge.events.read',
    'concierge.campaign.plan',
  ], ['plan_event', 'generate_report', 'optimize'], [
    'event', 'campaign', 'promotion', 'schedule', 'tapahtuma', 'kampanja',
  ]),
  agent('concierge.parking_manager', 'shoppermind', AgentRole.PARKING_MANAGER, DomainType.PARKING, [
    'concierge.parking.read',
  ], ['query_data', 'optimize', 'troubleshoot', 'predict'], [
    'parking', 'pysäköinti', 'parkki', 'spots', 'free', 'garage', 'occupancy',
  ]),
  agent('concierge.trend_analyst', 'shoppermind', AgentRole.TREND_ANALYST, DomainType.TRENDS, [
    'shoppermind.retrieval.search',
    'venuemind.venue_brief.read',
  ], ['analyze_trends', 'predict', 'compare_metrics', 'explain'], [
    'trend', 'pattern', 'forecast', 'behavior', 'demographic', 'analysis', 'ennuste',
  ]),
  agent('concierge.general_assistant', 'shared', AgentRole.GENERAL_ASSISTANT, DomainType.GENERAL, [], [
    'general_question',
    'explain',
  ], [
    'help',
    'general',
    'information',
    'what can',
  ], true),
];

export function conciergeMetadata(agent: AgentDefinition): ConciergeAgentMetadata {
  return agent.metadata as unknown as ConciergeAgentMetadata;
}

function tool(id: string, domain: string, key: string): RuntimeToolDefinition {
  return {
    id,
    domain,
    description: textKey(key),
    requiredScopes: ['customerId'],
    inputContract: { name: `${id}.input`, version: '1' },
    outputContract: { name: `${id}.output`, version: '1' },
  };
}

function agent(
  id: string,
  domain: string,
  role: AgentRole,
  domainType: DomainType,
  toolIds: string[],
  intents: AgentTaskIntent[],
  keywords: string[],
  fallback = false,
): AgentDefinition {
  return {
    id,
    domain,
    label: textKey(`concierge.agents.${id}`),
    capabilities: [{
      id: `${id}.capability`,
      taskTypes: ['analysis', 'planning', 'reporting', 'operations', 'chat'],
      intents,
      requiredToolIds: toolIds,
    }],
    allowedToolIds: toolIds,
    memoryTiers: ['retrieval', 'ui_cache'],
    validation: [{ kind: 'source_count', required: !fallback }],
    outputContract: { name: 'ConciergeAgentAnswer', version: '1' },
    scopeConstraints: ['customerId'],
    routing: { keywords, fallback },
    metadata: { agentRole: role, domainType },
  };
}
