import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryAgentRegistry } from '../agent-registry.js';
import { literalText } from '../localized-text.js';
import type { AgentDefinition, RuntimeToolDefinition } from '../agent-types.js';

const tool: RuntimeToolDefinition = {
  id: 'shoppermind.market_overview.read',
  domain: 'shoppermind',
  description: literalText('Read market overview'),
  requiredScopes: ['customerId', 'marketId'],
  inputContract: { name: 'MarketOverviewInput', version: '1' },
  outputContract: { name: 'MarketOverviewOutput', version: '1' },
};

test('InMemoryAgentRegistry routes by config, intent, keyword, and scope', () => {
  const registry = new InMemoryAgentRegistry();
  registry.registerTool(tool);
  registry.registerAgent(agent('shoppermind.trend_analyst', ['trend', 'signal']));
  registry.registerAgent(agent('shared.general', [], true));

  const route = registry.routeTask({
    domain: 'shoppermind',
    intent: 'analyze_trends',
    prompt: 'Analyze trend signals in Helsinki',
    scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
  });

  assert.equal(route.agentId, 'shoppermind.trend_analyst');
  assert.ok(route.confidence > 0.7);
  assert.ok(route.reasons.includes('intent_match'));
});

test('InMemoryAgentRegistry rejects agents whose scope cannot be satisfied', () => {
  const registry = new InMemoryAgentRegistry();
  registry.registerTool(tool);
  registry.registerAgent(agent('shoppermind.trend_analyst', ['trend']));
  registry.registerAgent(agent('shared.general', [], true));

  const route = registry.routeTask({
    domain: 'shoppermind',
    prompt: 'Analyze trend signals',
    scope: { customerId: 'customer-a' },
  });

  assert.equal(route.agentId, 'shared.general');
  assert.equal(route.reasons[0], 'fallback_agent');
});

function agent(id: string, keywords: string[], fallback = false): AgentDefinition {
  return {
    id,
    domain: fallback ? 'shared' : 'shoppermind',
    label: literalText(id),
    capabilities: [{
      id: 'trend-analysis',
      taskTypes: ['analysis'],
      intents: ['analyze_trends'],
      requiredToolIds: fallback ? [] : [tool.id],
    }],
    allowedToolIds: fallback ? [] : [tool.id],
    memoryTiers: ['retrieval'],
    validation: [{ kind: 'source_count', required: true }],
    outputContract: { name: 'AgentAnswer', version: '1' },
    scopeConstraints: fallback ? ['customerId'] : ['customerId', 'marketId'],
    routing: { keywords, fallback },
  };
}
