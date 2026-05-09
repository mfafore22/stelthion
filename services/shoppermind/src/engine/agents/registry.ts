import { InMemoryAgentRegistry } from '@stelthion/intelligence-runtime';
import { shopperMindAgentDefinitions } from './definitions.js';
import { shopperMindToolDefinitions } from './tools.js';

export function createShopperMindAgentRegistry(): InMemoryAgentRegistry {
  const registry = new InMemoryAgentRegistry();
  for (const tool of shopperMindToolDefinitions) registry.registerTool(tool);
  for (const agent of shopperMindAgentDefinitions) registry.registerAgent(agent);
  return registry;
}
