import type { LocalizedText } from './localized-text.js';
import type { MemoryTier } from './memory.js';
import type { RuntimeContext, RuntimeScope } from './runtime.js';
import type { ValidationRequirement } from './validation.js';

export type RuntimeScopeDimension = 'customerId' | 'propertyId' | 'marketId' | 'venueId';

export type AgentTaskIntent =
  | 'query_data'
  | 'analyze_trends'
  | 'compare_metrics'
  | 'generate_report'
  | 'plan_event'
  | 'optimize'
  | 'predict'
  | 'explain'
  | 'troubleshoot'
  | 'general_question';

export type AgentTaskType =
  | 'analysis'
  | 'planning'
  | 'reporting'
  | 'operations'
  | 'chat'
  | (string & {});

export interface ToolContract {
  name: string;
  version: string;
  jsonSchema?: Record<string, unknown>;
}

export interface RuntimeToolDefinition<Input = unknown, Output = unknown> {
  id: string;
  domain?: string;
  description: LocalizedText;
  requiredScopes: RuntimeScopeDimension[];
  inputContract: ToolContract;
  outputContract: ToolContract;
  invoke?: (input: Input, context: RuntimeContext) => Promise<Output>;
}

export interface AgentCapabilityDefinition {
  id: string;
  taskTypes: AgentTaskType[];
  intents: AgentTaskIntent[];
  requiredToolIds: string[];
}

export interface AgentRoutingHints {
  keywords: string[];
  fallback?: boolean;
}

export interface AgentDefinition {
  id: string;
  domain: string;
  label: LocalizedText;
  description?: LocalizedText;
  capabilities: AgentCapabilityDefinition[];
  allowedToolIds: string[];
  memoryTiers: MemoryTier[];
  validation: ValidationRequirement[];
  outputContract: ToolContract;
  scopeConstraints: RuntimeScopeDimension[];
  routing: AgentRoutingHints;
  metadata?: Record<string, unknown>;
}

export interface AgentTask {
  prompt: string;
  scope: RuntimeScope;
  domain?: string;
  intent?: AgentTaskIntent;
  taskType?: AgentTaskType;
}

export interface AgentRouteCandidate {
  agentId: string;
  confidence: number;
  reasons: string[];
}

export interface AgentRouteDecision extends AgentRouteCandidate {
  alternatives: AgentRouteCandidate[];
}
