import { validateAgentGovernance } from '@stelthion/intelligence-runtime';
import { shopperMindAgentDefinitions } from './definitions.js';
import { shopperMindToolDefinitions } from './tools.js';

export function runShopperMindAgentGovernance() {
  return validateAgentGovernance(shopperMindAgentDefinitions, shopperMindToolDefinitions);
}
