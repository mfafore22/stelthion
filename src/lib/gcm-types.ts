/**
 * Shared GCM Types
 *
 * Type definitions shared between GCM service and Next.js app.
 * Extracted to avoid importing from embedded GCM code.
 */

/**
 * Agent role/persona
 */
export enum AgentRole {
  SALES_OPTIMIZER = 'sales-optimizer',
  FOOTFALL_ANALYST = 'footfall-analyst',
  EVENT_COORDINATOR = 'event-coordinator',
  GENERAL_ASSISTANT = 'general-assistant',
  PARKING_MANAGER = 'parking-manager',
  TREND_ANALYST = 'trend-analyst',
}

/**
 * Orchestration options
 */
export interface OrchestrationOptions {
  /** Maximum iterations for tool execution loop */
  maxIterations?: number;

  /** Temperature for LLM generation */
  temperature?: number;

  /** Whether to use RAG for context */
  useRAG?: boolean;

  /** RAG configuration */
  ragConfig?: {
    topK: number;
    minScore: number;
  };

  /** Custom metadata */
  metadata?: {
    agentRole?: AgentRole;
    locationId?: string;
    [key: string]: any;
  };
}
