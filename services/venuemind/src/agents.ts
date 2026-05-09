import {
  InMemoryAgentRegistry,
  textKey,
  type AgentDefinition,
  type RuntimeToolDefinition,
} from '@stelthion/intelligence-runtime';

export const venueMindToolDefinitions: RuntimeToolDefinition[] = [
  {
    id: 'venuemind.venue_brief.read',
    domain: 'venuemind',
    description: textKey('venuemind.tools.venueBrief'),
    requiredScopes: ['customerId', 'venueId'],
    inputContract: { name: 'VenueMindBriefInput', version: '1' },
    outputContract: { name: 'VenueMindBrief', version: '1' },
  },
  {
    id: 'venuemind.event_risk.score',
    domain: 'venuemind',
    description: textKey('venuemind.tools.eventRisk'),
    requiredScopes: ['customerId', 'venueId'],
    inputContract: { name: 'VenueMindEventRiskInput', version: '1' },
    outputContract: { name: 'VenueMindEventRisk', version: '1' },
  },
  {
    id: 'imf.macro_context.read',
    domain: 'shared',
    description: textKey('shared.tools.imfMacroContext'),
    requiredScopes: ['customerId'],
    inputContract: { name: 'MacroContextRequest', version: '1' },
    outputContract: { name: 'MacroIndicatorSeries', version: '1' },
  },
];

export const venueMindAgentDefinitions: AgentDefinition[] = [
  {
    id: 'venuemind.operations_analyst',
    domain: 'venuemind',
    label: textKey('venuemind.agents.operationsAnalyst.label'),
    description: textKey('venuemind.agents.operationsAnalyst.description'),
    capabilities: [{
      id: 'venue-operations',
      taskTypes: ['analysis', 'operations', 'chat'],
      intents: ['query_data', 'analyze_trends', 'predict', 'troubleshoot'],
      requiredToolIds: ['venuemind.venue_brief.read', 'venuemind.event_risk.score'],
    }],
    allowedToolIds: [
      'venuemind.venue_brief.read',
      'venuemind.event_risk.score',
      'imf.macro_context.read',
    ],
    memoryTiers: ['fresh_signal', 'background_context', 'ui_cache'],
    validation: [
      { kind: 'freshness', required: true, blockerOnFailure: true },
      { kind: 'sensitive_claim', required: true },
    ],
    outputContract: { name: 'VenueMindOperationsAnswer', version: '1' },
    scopeConstraints: ['customerId', 'venueId'],
    routing: { keywords: ['venue', 'event', 'flow', 'queue', 'risk', 'operations'] },
  },
];

export function createVenueMindAgentRegistry(): InMemoryAgentRegistry {
  const registry = new InMemoryAgentRegistry();
  for (const tool of venueMindToolDefinitions) registry.registerTool(tool);
  for (const agent of venueMindAgentDefinitions) registry.registerAgent(agent);
  return registry;
}
