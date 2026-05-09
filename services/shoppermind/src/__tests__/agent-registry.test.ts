import { describe, expect, it } from 'vitest';
import { createShopperMindAgentRegistry } from '../engine/agents/registry.js';

describe('createShopperMindAgentRegistry', () => {
  it('routes market trend work through the shared runtime registry', () => {
    const registry = createShopperMindAgentRegistry();
    const route = registry.routeTask({
      domain: 'shoppermind',
      intent: 'analyze_trends',
      prompt: 'Analyze market demand signals',
      scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    });

    expect(route.agentId).toBe('shoppermind.trend_analyst');
    expect(route.confidence).toBeGreaterThan(0.7);
  });
});
