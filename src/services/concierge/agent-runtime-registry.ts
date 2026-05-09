import { InMemoryAgentRegistry } from '@stelthion/intelligence-runtime';
import { AgentRole } from '@/lib/gcm-types';
import { DomainType } from './types';
import {
  conciergeAgentDefinitions,
  conciergeMetadata,
  conciergeToolDefinitions,
} from './agent-runtime-definitions';

let registry: InMemoryAgentRegistry | null = null;

export function getConciergeRuntimeRegistry(): InMemoryAgentRegistry {
  if (registry) return registry;
  registry = new InMemoryAgentRegistry();
  for (const tool of conciergeToolDefinitions) registry.registerTool(tool);
  for (const agent of conciergeAgentDefinitions) registry.registerAgent(agent);
  return registry;
}

export function roleForAgent(agentId: string): AgentRole {
  const agent = conciergeAgentDefinitions.find((item) => item.id === agentId);
  return agent ? conciergeMetadata(agent).agentRole : AgentRole.GENERAL_ASSISTANT;
}

export function domainForAgent(agentId: string): DomainType {
  const agent = conciergeAgentDefinitions.find((item) => item.id === agentId);
  return agent ? conciergeMetadata(agent).domainType : DomainType.GENERAL;
}

export function runtimeDomainFor(domain: DomainType): string | undefined {
  if (domain === DomainType.EVENTS) return 'campaigns';
  if (domain === DomainType.GENERAL || domain === DomainType.OPERATIONS) return 'shared';
  return 'shoppermind';
}

export function domainKeywordMap(): Record<DomainType, string[]> {
  const out = {} as Record<DomainType, string[]>;
  for (const domain of Object.values(DomainType)) out[domain] = [];
  for (const agent of conciergeAgentDefinitions) {
    const domain = conciergeMetadata(agent).domainType;
    out[domain].push(...agent.routing.keywords);
  }
  return out;
}
