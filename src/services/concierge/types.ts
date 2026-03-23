/**
 * Concierge (GCM Agent Interface) Types
 *
 * Type definitions for the conversational AI interface.
 */

import { AgentRole } from '@/lib/gcm-types';

/**
 * Message sender type
 */
export type MessageSender = 'user' | 'agent' | 'system';

/**
 * Message status
 */
export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

/**
 * Tool execution status
 */
export type ToolExecutionStatus = 'pending' | 'running' | 'complete' | 'error';

/**
 * Conversation message
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  agentRole?: AgentRole;
  toolExecutions?: ToolExecution[];
  dataAttachments?: DataAttachment[];
  error?: string;
}

/**
 * Tool execution record
 */
export interface ToolExecution {
  id: string;
  toolName: string;
  status: ToolExecutionStatus;
  progress?: number; // 0-100
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

/**
 * Data attachment (tables, charts, etc.)
 */
export interface DataAttachment {
  id: string;
  type: 'table' | 'chart' | 'metrics' | 'file';
  title: string;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  title: string;
  tenantId: string;
  userId: string;
  agentRole: AgentRole;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation summary (for list view)
 */
export interface ConversationSummary {
  id: string;
  title: string;
  agentRole: AgentRole;
  preview: string; // First message or summary
  messageCount: number;
  toolsUsed: number;
  lastMessageAt: Date;
  createdAt: Date;
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'data_access' | 'analysis' | 'planning' | 'reporting' | 'optimization';
  tools: string[];
  ragEnabled: boolean;
}

/**
 * Custom agent configuration
 */
export interface CustomAgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  capabilities: AgentCapability[];
  temperature: number;
  maxToolIterations: number;
  ragConfig?: {
    enabled: boolean;
    topK: number;
    minScore: number;
  };
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

/**
 * Agent routing suggestion
 */
export interface AgentSuggestion {
  agentRole: AgentRole | 'custom';
  customAgentId?: string;
  confidence: number; // 0-1
  reasoning: string;
  alternativeAgents?: Array<{
    agentRole: AgentRole | 'custom';
    customAgentId?: string;
    confidence: number;
  }>;
}

/**
 * Intent classification result
 */
export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  entities: ExtractedEntity[];
  domain: DomainType;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Intent types
 */
export enum IntentType {
  QUERY_DATA = 'query_data',
  ANALYZE_TRENDS = 'analyze_trends',
  COMPARE_METRICS = 'compare_metrics',
  GENERATE_REPORT = 'generate_report',
  PLAN_EVENT = 'plan_event',
  OPTIMIZE = 'optimize',
  PREDICT = 'predict',
  EXPLAIN = 'explain',
  TROUBLESHOOT = 'troubleshoot',
  GENERAL_QUESTION = 'general_question',
}

/**
 * Domain types
 */
export enum DomainType {
  SALES = 'sales',
  FOOTFALL = 'footfall',
  EVENTS = 'events',
  PARKING = 'parking',
  TRENDS = 'trends',
  OPERATIONS = 'operations',
  GENERAL = 'general',
}

/**
 * Extracted entity
 */
export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  span: { start: number; end: number };
}

/**
 * Entity types
 */
export enum EntityType {
  DATE = 'date',
  DATE_RANGE = 'date_range',
  LOCATION = 'location',
  CATEGORY = 'category',
  METRIC = 'metric',
  TENANT = 'tenant',
  EVENT = 'event',
  AMOUNT = 'amount',
  PERCENTAGE = 'percentage',
}

/**
 * WebSocket message types
 */
export enum WSMessageType {
  // Client → Server
  MESSAGE_SEND = 'message.send',
  MESSAGE_STOP = 'message.stop',
  CONVERSATION_CREATE = 'conversation.create',
  CONVERSATION_LOAD = 'conversation.load',

  // Server → Client
  MESSAGE_START = 'message.start',
  MESSAGE_CHUNK = 'message.chunk',
  MESSAGE_COMPLETE = 'message.complete',
  MESSAGE_ERROR = 'message.error',
  TOOL_START = 'tool.start',
  TOOL_PROGRESS = 'tool.progress',
  TOOL_COMPLETE = 'tool.complete',
  TOOL_ERROR = 'tool.error',
  AGENT_SUGGESTION = 'agent.suggestion',
}

/**
 * WebSocket message base
 */
export interface WSMessage {
  type: WSMessageType;
  conversationId: string;
  timestamp: Date;
}

/**
 * Client → Server: Send message
 */
export interface WSMessageSend extends WSMessage {
  type: WSMessageType.MESSAGE_SEND;
  content: string;
  agentRole?: AgentRole;
  customAgentId?: string;
}

/**
 * Server → Client: Message chunk (streaming)
 */
export interface WSMessageChunk extends WSMessage {
  type: WSMessageType.MESSAGE_CHUNK;
  messageId: string;
  chunk: string;
  done: boolean;
}

/**
 * Server → Client: Tool execution start
 */
export interface WSToolStart extends WSMessage {
  type: WSMessageType.TOOL_START;
  executionId: string;
  toolName: string;
  params: Record<string, unknown>;
}

/**
 * Server → Client: Tool execution progress
 */
export interface WSToolProgress extends WSMessage {
  type: WSMessageType.TOOL_PROGRESS;
  executionId: string;
  progress: number;
  status?: string;
}

/**
 * Server → Client: Tool execution complete
 */
export interface WSToolComplete extends WSMessage {
  type: WSMessageType.TOOL_COMPLETE;
  executionId: string;
  result: unknown;
  durationMs: number;
}

/**
 * Server → Client: Agent suggestion
 */
export interface WSAgentSuggestion extends WSMessage {
  type: WSMessageType.AGENT_SUGGESTION;
  suggestion: AgentSuggestion;
}

/**
 * UI State
 */
export interface ConciergeUIState {
  panelOpen: boolean;
  panelMinimized: boolean;
  activeConversationId: string | null;
  conversations: ConversationSummary[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * User preferences
 */
export interface ConciergePreferences {
  language: 'en' | 'fi';
  theme: 'light' | 'dark' | 'auto';
  defaultAgent: AgentRole | 'custom';
  defaultCustomAgentId?: string;
  autoScroll: boolean;
  soundEnabled: boolean;
  panelWidth: number;
  showToolDetails: boolean;
  sessionSparkleShown: boolean;
}

/**
 * Export format
 */
export enum ExportFormat {
  PDF = 'pdf',
  MARKDOWN = 'markdown',
  HTML = 'html',
  JSON = 'json',
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMessages: boolean;
  includeToolExecutions: boolean;
  includeDataTables: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
}

/**
 * Share options
 */
export interface ShareOptions {
  userIds: string[];
  permissions: 'view' | 'comment';
  expiresAt?: Date;
  message?: string;
}

/**
 * Finnish language translation
 */
export interface Translation {
  key: string;
  en: string;
  fi: string;
}

/**
 * Language fallback result
 */
export interface LanguageResult {
  text: string;
  language: 'en' | 'fi';
  isFallback: boolean;
  apologyText?: string; // Finnish apology if fallback used
}
