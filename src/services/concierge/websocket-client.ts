/**
 * WebSocket Client for Concierge
 *
 * Handles real-time streaming communication with GCM backend.
 */

import {
  WSMessageType,
  WSMessage,
  WSMessageSend,
  WSMessageChunk,
  WSToolStart,
  WSToolProgress,
  WSToolComplete,
  WSAgentSuggestion,
  ConversationMessage,
  ToolExecution,
  AgentSuggestion,
} from './types';
import { AgentRole } from '@/lib/gcm-types';

/**
 * WebSocket connection state
 */
export enum WSConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Event handlers
 */
export interface WSEventHandlers {
  onConnectionChange?: (state: WSConnectionState) => void;
  onMessageStart?: (conversationId: string, messageId: string) => void;
  onMessageChunk?: (conversationId: string, messageId: string, chunk: string, done: boolean) => void;
  onMessageComplete?: (conversationId: string, message: ConversationMessage) => void;
  onMessageError?: (conversationId: string, error: string) => void;
  onToolStart?: (conversationId: string, execution: ToolExecution) => void;
  onToolProgress?: (conversationId: string, executionId: string, progress: number) => void;
  onToolComplete?: (conversationId: string, execution: ToolExecution) => void;
  onToolError?: (conversationId: string, executionId: string, error: string) => void;
  onAgentSuggestion?: (conversationId: string, suggestion: AgentSuggestion) => void;
}

/**
 * WebSocket Client Class
 */
export class ConciergeWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: WSEventHandlers;
  private connectionState: WSConnectionState = WSConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pendingMessages: WSMessageSend[] = [];
  private activeExecutions: Map<string, ToolExecution> = new Map();

  constructor(url: string, handlers: WSEventHandlers = {}) {
    this.url = url;
    this.handlers = handlers;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    // Skip connection if no URL is provided
    if (!this.url) {
      console.log('[WebSocket] No URL provided, skipping connection');
      return;
    }

    if (this.ws && this.connectionState === WSConnectionState.CONNECTED) {
      console.warn('[WebSocket] Already connected');
      return;
    }

    this.setConnectionState(WSConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.setConnectionState(WSConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();

        // Send pending messages
        this.flushPendingMessages();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.setConnectionState(WSConnectionState.ERROR);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason);
        this.setConnectionState(WSConnectionState.DISCONNECTED);
        this.stopHeartbeat();

        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.setConnectionState(WSConnectionState.ERROR);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState(WSConnectionState.DISCONNECTED);
  }

  /**
   * Send a message
   */
  sendMessage(
    conversationId: string,
    content: string,
    agentRole?: AgentRole,
    customAgentId?: string
  ): void {
    const message: WSMessageSend = {
      type: WSMessageType.MESSAGE_SEND,
      conversationId,
      content,
      timestamp: new Date(),
      agentRole,
      customAgentId,
    };

    if (this.connectionState === WSConnectionState.CONNECTED && this.ws) {
      this.send(message);
    } else {
      // Queue message for later
      this.pendingMessages.push(message);
      console.log('[WebSocket] Message queued (not connected)');
    }
  }

  /**
   * Stop current streaming message
   */
  stopMessage(conversationId: string): void {
    const message: WSMessage = {
      type: WSMessageType.MESSAGE_STOP,
      conversationId,
      timestamp: new Date(),
    };

    this.send(message);
  }

  /**
   * Create new conversation
   */
  createConversation(
    conversationId: string,
    agentRole?: AgentRole,
    customAgentId?: string
  ): void {
    const message: WSMessage & { agentRole?: AgentRole; customAgentId?: string } = {
      type: WSMessageType.CONVERSATION_CREATE,
      conversationId,
      timestamp: new Date(),
      agentRole,
      customAgentId,
    };

    this.send(message);
  }

  /**
   * Load existing conversation
   */
  loadConversation(conversationId: string): void {
    const message: WSMessage = {
      type: WSMessageType.CONVERSATION_LOAD,
      conversationId,
      timestamp: new Date(),
    };

    this.send(message);
  }

  /**
   * Get connection state
   */
  getConnectionState(): WSConnectionState {
    return this.connectionState;
  }

  /**
   * Get active tool executions
   */
  getActiveExecutions(): ToolExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSMessage;

      switch (message.type) {
        case WSMessageType.MESSAGE_START:
          this.handleMessageStart(message as WSMessage & { messageId: string });
          break;

        case WSMessageType.MESSAGE_CHUNK:
          this.handleMessageChunk(message as WSMessageChunk);
          break;

        case WSMessageType.MESSAGE_COMPLETE:
          this.handleMessageComplete(message as WSMessage & { message: ConversationMessage });
          break;

        case WSMessageType.MESSAGE_ERROR:
          this.handleMessageError(message as WSMessage & { error: string });
          break;

        case WSMessageType.TOOL_START:
          this.handleToolStart(message as WSToolStart);
          break;

        case WSMessageType.TOOL_PROGRESS:
          this.handleToolProgress(message as WSToolProgress);
          break;

        case WSMessageType.TOOL_COMPLETE:
          this.handleToolComplete(message as WSToolComplete);
          break;

        case WSMessageType.TOOL_ERROR:
          this.handleToolError(message as WSMessage & { executionId: string; error: string });
          break;

        case WSMessageType.AGENT_SUGGESTION:
          this.handleAgentSuggestion(message as WSAgentSuggestion);
          break;

        default:
          console.warn('[WebSocket] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle message start
   */
  private handleMessageStart(message: WSMessage & { messageId: string }): void {
    this.handlers.onMessageStart?.(message.conversationId, message.messageId);
  }

  /**
   * Handle message chunk
   */
  private handleMessageChunk(message: WSMessageChunk): void {
    this.handlers.onMessageChunk?.(
      message.conversationId,
      message.messageId,
      message.chunk,
      message.done
    );
  }

  /**
   * Handle message complete
   */
  private handleMessageComplete(message: WSMessage & { message: ConversationMessage }): void {
    this.handlers.onMessageComplete?.(message.conversationId, message.message);
  }

  /**
   * Handle message error
   */
  private handleMessageError(message: WSMessage & { error: string }): void {
    this.handlers.onMessageError?.(message.conversationId, message.error);
  }

  /**
   * Handle tool execution start
   */
  private handleToolStart(message: WSToolStart): void {
    const execution: ToolExecution = {
      id: message.executionId,
      toolName: message.toolName,
      status: 'running',
      progress: 0,
      params: message.params,
      startedAt: new Date(),
    };

    this.activeExecutions.set(message.executionId, execution);
    this.handlers.onToolStart?.(message.conversationId, execution);
  }

  /**
   * Handle tool execution progress
   */
  private handleToolProgress(message: WSToolProgress): void {
    const execution = this.activeExecutions.get(message.executionId);
    if (execution) {
      execution.progress = message.progress;
      this.handlers.onToolProgress?.(message.conversationId, message.executionId, message.progress);
    }
  }

  /**
   * Handle tool execution complete
   */
  private handleToolComplete(message: WSToolComplete): void {
    const execution = this.activeExecutions.get(message.executionId);
    if (execution) {
      execution.status = 'complete';
      execution.progress = 100;
      execution.result = message.result;
      execution.completedAt = new Date();
      execution.durationMs = message.durationMs;

      this.activeExecutions.delete(message.executionId);
      this.handlers.onToolComplete?.(message.conversationId, execution);
    }
  }

  /**
   * Handle tool execution error
   */
  private handleToolError(message: WSMessage & { executionId: string; error: string }): void {
    const execution = this.activeExecutions.get(message.executionId);
    if (execution) {
      execution.status = 'error';
      execution.error = message.error;
      execution.completedAt = new Date();

      this.activeExecutions.delete(message.executionId);
      this.handlers.onToolError?.(message.conversationId, message.executionId, message.error);
    }
  }

  /**
   * Handle agent suggestion
   */
  private handleAgentSuggestion(message: WSAgentSuggestion): void {
    this.handlers.onAgentSuggestion?.(message.conversationId, message.suggestion);
  }

  /**
   * Send message to server
   */
  private send(message: WSMessage | WSMessageSend): void {
    if (this.ws && this.connectionState === WSConnectionState.CONNECTED) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message (not connected)');
    }
  }

  /**
   * Flush pending messages
   */
  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Reconnect to server
   */
  private reconnect(): void {
    this.reconnectAttempts++;
    this.setConnectionState(WSConnectionState.RECONNECTING);

    console.log(
      `[WebSocket] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.connectionState === WSConnectionState.CONNECTED) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Set connection state and notify
   */
  private setConnectionState(state: WSConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.handlers.onConnectionChange?.(state);
    }
  }
}

/**
 * Create WebSocket client instance
 */
export function createWebSocketClient(
  url: string,
  handlers?: WSEventHandlers
): ConciergeWebSocketClient {
  return new ConciergeWebSocketClient(url, handlers);
}
