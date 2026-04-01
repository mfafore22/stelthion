/**
 * Integration Tests for WebSocket Client
 *
 * Tests real-time streaming, connection management, and event handling
 */

import { ConciergeWebSocketClient, WSConnectionState, createWebSocketClient } from '../websocket-client';
import { WSMessageType, ConversationMessage, ToolExecution } from '../types';
import { AgentRole } from '../../gcm/orchestrator/types';

// Mock WebSocket
class MockWebSocket {
  public url: string;
  public onopen: ((ev: Event) => void) | null = null;
  public onmessage: ((ev: MessageEvent) => void) | null = null;
  public onerror: ((ev: Event) => void) | null = null;
  public onclose: ((ev: CloseEvent) => void) | null = null;
  public readyState: number = 0; // CONNECTING

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    // Mock send - do nothing
  }

  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }));
    }
  }

  // Test helper: simulate receiving a message
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Test helper: simulate error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('ConciergeWebSocketClient', () => {
  let client: ConciergeWebSocketClient;
  let mockWS: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      const onConnectionChange = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onConnectionChange });

      client.connect();

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onConnectionChange).toHaveBeenCalledWith(WSConnectionState.CONNECTING);
      expect(onConnectionChange).toHaveBeenCalledWith(WSConnectionState.CONNECTED);
      expect(client.getConnectionState()).toBe(WSConnectionState.CONNECTED);
    });

    it('should disconnect cleanly', async () => {
      const onConnectionChange = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onConnectionChange });

      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      client.disconnect();

      expect(onConnectionChange).toHaveBeenCalledWith(WSConnectionState.DISCONNECTED);
      expect(client.getConnectionState()).toBe(WSConnectionState.DISCONNECTED);
    });

    it('should handle connection errors', async () => {
      const onConnectionChange = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onConnectionChange });

      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Simulate error
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateError();

      expect(onConnectionChange).toHaveBeenCalledWith(WSConnectionState.ERROR);
    });

    it('should queue messages when not connected', () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');

      // Send message before connecting
      client.sendMessage('conv-123', 'Hello world', AgentRole.GENERAL_ASSISTANT);

      const pendingMessages = (client as any).pendingMessages;
      expect(pendingMessages).toHaveLength(1);
      expect(pendingMessages[0].content).toBe('Hello world');
    });

    it('should flush pending messages after connection', async () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');

      // Queue messages before connecting
      client.sendMessage('conv-123', 'Message 1');
      client.sendMessage('conv-123', 'Message 2');

      expect((client as any).pendingMessages).toHaveLength(2);

      // Connect
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Pending messages should be cleared
      expect((client as any).pendingMessages).toHaveLength(0);
    });
  });

  describe('Message Streaming', () => {
    beforeEach(async () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should handle message start event', async () => {
      const onMessageStart = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onMessageStart });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: WSMessageType.MESSAGE_START,
        conversationId: 'conv-123',
        messageId: 'msg-456',
        timestamp: new Date(),
      });

      expect(onMessageStart).toHaveBeenCalledWith('conv-123', 'msg-456');
    });

    it('should handle message chunks', async () => {
      const onMessageChunk = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onMessageChunk });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      // Simulate streaming chunks
      ws.simulateMessage({
        type: WSMessageType.MESSAGE_CHUNK,
        conversationId: 'conv-123',
        messageId: 'msg-456',
        chunk: 'Hello ',
        done: false,
        timestamp: new Date(),
      });

      ws.simulateMessage({
        type: WSMessageType.MESSAGE_CHUNK,
        conversationId: 'conv-123',
        messageId: 'msg-456',
        chunk: 'world!',
        done: true,
        timestamp: new Date(),
      });

      expect(onMessageChunk).toHaveBeenCalledTimes(2);
      expect(onMessageChunk).toHaveBeenCalledWith('conv-123', 'msg-456', 'Hello ', false);
      expect(onMessageChunk).toHaveBeenCalledWith('conv-123', 'msg-456', 'world!', true);
    });

    it('should handle message complete event', async () => {
      const onMessageComplete = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onMessageComplete });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      const completeMessage: ConversationMessage = {
        id: 'msg-456',
        conversationId: 'conv-123',
        sender: 'agent',
        content: 'Hello world!',
        timestamp: new Date(),
        status: 'sent',
        agentRole: AgentRole.GENERAL_ASSISTANT,
      };

      ws.simulateMessage({
        type: WSMessageType.MESSAGE_COMPLETE,
        conversationId: 'conv-123',
        message: completeMessage,
        timestamp: new Date(),
      });

      expect(onMessageComplete).toHaveBeenCalledWith('conv-123', completeMessage);
    });

    it('should handle message errors', async () => {
      const onMessageError = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onMessageError });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage({
        type: WSMessageType.MESSAGE_ERROR,
        conversationId: 'conv-123',
        error: 'LLM request failed',
        timestamp: new Date(),
      });

      expect(onMessageError).toHaveBeenCalledWith('conv-123', 'LLM request failed');
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should handle tool execution start', async () => {
      const onToolStart = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onToolStart });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage({
        type: WSMessageType.TOOL_START,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        toolName: 'get_sales_data',
        params: { location_id: 'ideapark', date: '2025-11-18' },
        timestamp: new Date(),
      });

      expect(onToolStart).toHaveBeenCalled();
      const execution = onToolStart.mock.calls[0][1] as ToolExecution;
      expect(execution.id).toBe('exec-789');
      expect(execution.toolName).toBe('get_sales_data');
      expect(execution.status).toBe('running');
      expect(execution.progress).toBe(0);

      // Verify active executions tracking
      const activeExecutions = client.getActiveExecutions();
      expect(activeExecutions).toHaveLength(1);
      expect(activeExecutions[0].id).toBe('exec-789');
    });

    it('should handle tool execution progress', async () => {
      const onToolStart = jest.fn();
      const onToolProgress = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onToolStart, onToolProgress });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      // Start execution
      ws.simulateMessage({
        type: WSMessageType.TOOL_START,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        toolName: 'get_sales_data',
        params: {},
        timestamp: new Date(),
      });

      // Progress updates
      ws.simulateMessage({
        type: WSMessageType.TOOL_PROGRESS,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        progress: 50,
        timestamp: new Date(),
      });

      ws.simulateMessage({
        type: WSMessageType.TOOL_PROGRESS,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        progress: 100,
        timestamp: new Date(),
      });

      expect(onToolProgress).toHaveBeenCalledWith('conv-123', 'exec-789', 50);
      expect(onToolProgress).toHaveBeenCalledWith('conv-123', 'exec-789', 100);
    });

    it('should handle tool execution completion', async () => {
      const onToolStart = jest.fn();
      const onToolComplete = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onToolStart, onToolComplete });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      // Start execution
      ws.simulateMessage({
        type: WSMessageType.TOOL_START,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        toolName: 'get_sales_data',
        params: {},
        timestamp: new Date(),
      });

      // Complete execution
      ws.simulateMessage({
        type: WSMessageType.TOOL_COMPLETE,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        result: { sales: 15000, currency: 'EUR' },
        durationMs: 234,
        timestamp: new Date(),
      });

      expect(onToolComplete).toHaveBeenCalled();
      const execution = onToolComplete.mock.calls[0][1] as ToolExecution;
      expect(execution.status).toBe('complete');
      expect(execution.progress).toBe(100);
      expect(execution.result).toEqual({ sales: 15000, currency: 'EUR' });
      expect(execution.durationMs).toBe(234);

      // Verify removed from active executions
      const activeExecutions = client.getActiveExecutions();
      expect(activeExecutions).toHaveLength(0);
    });

    it('should handle tool execution errors', async () => {
      const onToolStart = jest.fn();
      const onToolError = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onToolStart, onToolError });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      // Start execution
      ws.simulateMessage({
        type: WSMessageType.TOOL_START,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        toolName: 'get_sales_data',
        params: {},
        timestamp: new Date(),
      });

      // Simulate error
      ws.simulateMessage({
        type: WSMessageType.TOOL_ERROR,
        conversationId: 'conv-123',
        executionId: 'exec-789',
        error: 'Database connection timeout',
        timestamp: new Date(),
      });

      expect(onToolError).toHaveBeenCalledWith('conv-123', 'exec-789', 'Database connection timeout');

      // Verify removed from active executions
      const activeExecutions = client.getActiveExecutions();
      expect(activeExecutions).toHaveLength(0);
    });
  });

  describe('Agent Suggestions', () => {
    beforeEach(async () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should handle agent suggestions', async () => {
      const onAgentSuggestion = jest.fn();
      client = new ConciergeWebSocketClient('ws://localhost:8080', { onAgentSuggestion });
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage({
        type: WSMessageType.AGENT_SUGGESTION,
        conversationId: 'conv-123',
        suggestion: {
          agentRole: AgentRole.SALES_OPTIMIZER,
          confidence: 0.92,
          reasoning: 'This query is about sales optimization',
          alternativeAgents: [
            { agentRole: AgentRole.FOOTFALL_ANALYST, confidence: 0.45 },
          ],
        },
        timestamp: new Date(),
      });

      expect(onAgentSuggestion).toHaveBeenCalled();
      const suggestion = onAgentSuggestion.mock.calls[0][1];
      expect(suggestion.agentRole).toBe(AgentRole.SALES_OPTIMIZER);
      expect(suggestion.confidence).toBe(0.92);
      expect(suggestion.alternativeAgents).toHaveLength(1);
    });
  });

  describe('Factory Function', () => {
    it('should create client with factory function', () => {
      const handlers = {
        onConnectionChange: jest.fn(),
        onMessageStart: jest.fn(),
      };

      const client = createWebSocketClient('ws://localhost:8080', handlers);

      expect(client).toBeInstanceOf(ConciergeWebSocketClient);
      expect(client.getConnectionState()).toBe(WSConnectionState.DISCONNECTED);
    });
  });

  describe('Conversation Management', () => {
    beforeEach(async () => {
      client = new ConciergeWebSocketClient('ws://localhost:8080');
      client.connect();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should create new conversation', () => {
      const sendSpy = jest.spyOn(client as any, 'send');

      client.createConversation('conv-new', AgentRole.SALES_OPTIMIZER);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WSMessageType.CONVERSATION_CREATE,
          conversationId: 'conv-new',
          agentRole: AgentRole.SALES_OPTIMIZER,
        })
      );
    });

    it('should load existing conversation', () => {
      const sendSpy = jest.spyOn(client as any, 'send');

      client.loadConversation('conv-existing');

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WSMessageType.CONVERSATION_LOAD,
          conversationId: 'conv-existing',
        })
      );
    });

    it('should stop streaming message', () => {
      const sendSpy = jest.spyOn(client as any, 'send');

      client.stopMessage('conv-123');

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WSMessageType.MESSAGE_STOP,
          conversationId: 'conv-123',
        })
      );
    });
  });
});
