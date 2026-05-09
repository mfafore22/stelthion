import { AgentRole } from '@/lib/gcm-types';

export type AssistantSource =
  | 'assistants'
  | 'shoppermind'
  | 'campaigns'
  | 'space-optimizer'
  | 'concierge';

export interface AssistantReturnTarget {
  label: string;
  href: string;
}

export type AssistantViewContext =
  | { kind: 'assistant'; assistantId: string; label: string; source: AssistantSource; returnTarget?: AssistantReturnTarget }
  | { kind: 'shoppermind_trend'; phenomenonId: string; label: string; state: string; primaryCountry: string; returnTarget?: AssistantReturnTarget }
  | { kind: 'shoppermind_path'; pathId: 'a' | 'b' | 'c'; label: string; source: AssistantSource; returnTarget?: AssistantReturnTarget }
  | { kind: 'shoppermind_action'; actionId: string; label: string; source: AssistantSource; returnTarget?: AssistantReturnTarget }
  | { kind: 'campaign_brief'; label: string; source: AssistantSource; payload?: Record<string, unknown>; returnTarget?: AssistantReturnTarget }
  | { kind: 'space_suggestion'; suggestionId: string; label: string; source: AssistantSource; payload?: Record<string, unknown>; returnTarget?: AssistantReturnTarget }
  | { kind: 'data_source'; sourceId: string; label: string; source: AssistantSource; returnTarget?: AssistantReturnTarget }
  | { kind: 'security_policy'; policyId: string; label: string; source: AssistantSource; returnTarget?: AssistantReturnTarget }
  | { kind: 'property_snapshot'; label: string; source: AssistantSource; payload?: Record<string, unknown>; returnTarget?: AssistantReturnTarget };

export interface AssistantLaunch {
  agentRole: AgentRole;
  starterPrompt: string;
  viewContext: AssistantViewContext;
  targetMallId?: string;
}
