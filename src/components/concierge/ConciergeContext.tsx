/**
 * Concierge Context
 *
 * Global state management for the Concierge UI
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Conversation,
  ConversationSummary,
  ConversationMessage,
  ConciergeUIState,
  ConciergePreferences,
  ToolExecution,
  AgentSuggestion,
} from '@/services/concierge/types';
import { AgentRole } from '@/lib/gcm-types';
import {
  ConciergeWebSocketClient,
  WSConnectionState,
  createWebSocketClient,
} from '@/services/concierge/websocket-client';
import { getAgentRouter } from '@/services/concierge/agent-router';
import i18n from '@/lib/i18n';

/**
 * Context value type
 */
interface ConciergeContextValue {
  // UI State
  state: ConciergeUIState;
  preferences: ConciergePreferences;

  // Connection
  connectionState: WSConnectionState;

  // Active conversation
  activeConversation: Conversation | null;
  streamingMessage: string;
  activeToolExecutions: ToolExecution[];
  agentSuggestion: AgentSuggestion | null;

  // Actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  minimizePanel: () => void;

  createConversation: (agentRole?: AgentRole, customAgentId?: string) => void;
  loadConversation: (conversationId: string) => void;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;

  updatePreferences: (prefs: Partial<ConciergePreferences>) => void;

  // Conversations
  conversations: ConversationSummary[];
  refreshConversations: () => Promise<void>;
}

/**
 * Context
 */
const ConciergeContext = createContext<ConciergeContextValue | null>(null);

/**
 * Provider props
 */
interface ConciergeProviderProps {
  children: React.ReactNode;
  tenantId: string;
  userId: string;
  wsUrl?: string;
}

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: ConciergePreferences = {
  language: 'en',
  theme: 'dark',
  defaultAgent: AgentRole.GENERAL_ASSISTANT,
  autoScroll: true,
  soundEnabled: false,
  panelWidth: 300,
  showToolDetails: true,
  sessionSparkleShown: false,
};

/**
 * Concierge Provider
 */
export function ConciergeProvider({
  children,
  tenantId,
  userId,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL,
}: ConciergeProviderProps) {
  // UI State
  const [state, setState] = useState<ConciergeUIState>({
    panelOpen: false,
    panelMinimized: false,
    activeConversationId: null,
    conversations: [],
    isLoading: false,
    isStreaming: false,
    error: null,
  });

  // Preferences — always start from defaults to avoid SSR/client hydration mismatch,
  // then merge stored values after mount
  const [preferences, setPreferences] = useState<ConciergePreferences>(DEFAULT_PREFERENCES);
  useEffect(() => {
    const stored = localStorage.getItem('concierge_preferences');
    if (stored) {
      try {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        // ignore malformed stored value
      }
    }
  }, []);

  // Active conversation data
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [activeToolExecutions, setActiveToolExecutions] = useState<ToolExecution[]>([]);
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);

  // WebSocket
  const [wsClient, setWsClient] = useState<ConciergeWebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<WSConnectionState>(WSConnectionState.DISCONNECTED);

  // Initialize WebSocket client
  useEffect(() => {
    if (!wsUrl) return;

    const client = createWebSocketClient(wsUrl, {
      onConnectionChange: (state) => {
        setConnectionState(state);
      },

      onMessageStart: (conversationId, messageId) => {
        setState((prev) => ({ ...prev, isStreaming: true }));
        setStreamingMessage('');
      },

      onMessageChunk: (conversationId, messageId, chunk, done) => {
        setStreamingMessage((prev) => prev + chunk);

        if (done) {
          setState((prev) => ({ ...prev, isStreaming: false }));
        }
      },

      onMessageComplete: (conversationId, message) => {
        // Add message to conversation
        setActiveConversation((prev) => {
          if (!prev || prev.id !== conversationId) return prev;

          return {
            ...prev,
            messages: [...prev.messages, message],
            updatedAt: new Date(),
          };
        });

        setStreamingMessage('');
        setState((prev) => ({ ...prev, isStreaming: false }));
      },

      onMessageError: (conversationId, error) => {
        setState((prev) => ({ ...prev, error, isStreaming: false }));
      },

      onToolStart: (conversationId, execution) => {
        setActiveToolExecutions((prev) => [...prev, execution]);
      },

      onToolProgress: (conversationId, executionId, progress) => {
        setActiveToolExecutions((prev) =>
          prev.map((exec) => (exec.id === executionId ? { ...exec, progress } : exec))
        );
      },

      onToolComplete: (conversationId, execution) => {
        setActiveToolExecutions((prev) => prev.filter((exec) => exec.id !== execution.id));
      },

      onToolError: (conversationId, executionId, error) => {
        setActiveToolExecutions((prev) =>
          prev.map((exec) => (exec.id === executionId ? { ...exec, status: 'error', error } : exec))
        );
      },

      onAgentSuggestion: (conversationId, suggestion) => {
        setAgentSuggestion(suggestion);
      },
    });

    client.connect();
    setWsClient(client);

    return () => {
      client.disconnect();
    };
  }, [wsUrl]);

  // Load conversations (skip when no authenticated user)
  const refreshConversations = useCallback(async () => {
    if (tenantId === 'default') {
      setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/concierge/conversations?tenantId=${tenantId}`);
      if (!response.ok) {
        setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
        return;
      }
      const data = await response.json();

      setState((prev) => ({
        ...prev,
        conversations: data.conversations ?? [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
    }
  }, [tenantId]);

  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Actions
  const openPanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: true, panelMinimized: false }));
  }, []);

  const closePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: false }));
  }, []);

  const togglePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: !prev.panelOpen }));
  }, []);

  const minimizePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelMinimized: !prev.panelMinimized }));
  }, []);

  const createConversation = useCallback(
    (agentRole?: AgentRole, customAgentId?: string) => {
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const newConversation: Conversation = {
        id: conversationId,
        title: i18n.t('concierge.newConversation'),
        tenantId,
        userId,
        agentRole: agentRole ?? (preferences.defaultAgent as AgentRole),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setActiveConversation(newConversation);
      setState((prev) => ({ ...prev, activeConversationId: conversationId, panelOpen: true }));

      // Notify WebSocket
      wsClient?.createConversation(conversationId, agentRole, customAgentId);
    },
    [tenantId, userId, preferences.defaultAgent, wsClient]
  );

  const loadConversation = useCallback(
    (conversationId: string) => {
      setState((prev) => ({ ...prev, activeConversationId: conversationId, isLoading: true }));

      // TODO: Load conversation from API
      // For now, notify WebSocket
      wsClient?.loadConversation(conversationId);
    },
    [wsClient]
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversation) {
        // Auto-route to best agent
        const router = getAgentRouter();
        const suggestion = router.route(content);

        setAgentSuggestion(suggestion);
        createConversation(suggestion.agentRole as AgentRole);
      }

      // Add user message to UI immediately
      const userMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        conversationId: activeConversation!.id,
        sender: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      };

      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, userMessage],
          updatedAt: new Date(),
        };
      });

      // Send via WebSocket if connected; otherwise show a stub reply
      if (connectionState === WSConnectionState.CONNECTED) {
        wsClient?.sendMessage(activeConversation!.id, content);
      } else {
        const convId = activeConversation?.id ?? 'conv-stub';
        setTimeout(() => {
          const stubMessage: ConversationMessage = {
            id: `msg-stub-${Date.now()}`,
            conversationId: convId,
            sender: 'agent',
            content: i18n.t('concierge.noBackendStub'),
            timestamp: new Date(),
            status: 'sent',
          };
          setActiveConversation((prev) => {
            if (!prev) return prev;
            return { ...prev, messages: [...prev.messages, stubMessage] };
          });
        }, 800);
      }
    },
    [activeConversation, wsClient, connectionState, createConversation]
  );

  const stopStreaming = useCallback(() => {
    if (activeConversation) {
      wsClient?.stopMessage(activeConversation.id);
    }
  }, [activeConversation, wsClient]);

  const updatePreferences = useCallback((prefs: Partial<ConciergePreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...prefs };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('concierge_preferences', JSON.stringify(updated));
      }

      return updated;
    });
  }, []);

  const value: ConciergeContextValue = {
    state,
    preferences,
    connectionState,
    activeConversation,
    streamingMessage,
    activeToolExecutions,
    agentSuggestion,
    openPanel,
    closePanel,
    togglePanel,
    minimizePanel,
    createConversation,
    loadConversation,
    sendMessage,
    stopStreaming,
    updatePreferences,
    conversations: state.conversations,
    refreshConversations,
  };

  return <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>;
}

/**
 * Hook to use Concierge context
 */
export function useConcierge() {
  const context = useContext(ConciergeContext);

  if (!context) {
    throw new Error('useConcierge must be used within ConciergeProvider');
  }

  return context;
}
