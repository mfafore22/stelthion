/**
 * Concierge Context
 *
 * Global state management for the Concierge UI.
 * Uses HTTP SSE streaming instead of WebSocket.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Conversation,
  ConversationSummary,
  ConversationMessage,
  ConciergeUIState,
  ConciergePreferences,
  ToolExecution,
  AgentSuggestion,
  DataAttachment,
} from '@/services/concierge/types';
import { AgentRole } from '@/lib/gcm-types';
import { getAgentRouter } from '@/services/concierge/agent-router';
import { useTranslation } from 'react-i18next';
import { useViewContext } from '@/lib/shoppermind/view-context';

/**
 * Context value type
 */
interface ConciergeContextValue {
  state: ConciergeUIState;
  preferences: ConciergePreferences;
  activeConversation: Conversation | null;
  streamingMessage: string;
  activeToolExecutions: ToolExecution[];
  agentSuggestion: AgentSuggestion | null;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  minimizePanel: () => void;

  createConversation: (agentRole?: AgentRole, customAgentId?: string) => void;
  loadConversation: (conversationId: string) => void;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  setActiveAgent: (agentRole: AgentRole) => void;
  deleteActiveConversation: () => Promise<void>;

  updatePreferences: (prefs: Partial<ConciergePreferences>) => void;
  conversations: ConversationSummary[];
  refreshConversations: () => Promise<void>;
}

const ConciergeContext = createContext<ConciergeContextValue | null>(null);

interface ConciergeProviderProps {
  children: React.ReactNode;
  tenantId: string;
  userId: string;
  mallId: string;
}

const DEFAULT_PREFERENCES: ConciergePreferences = {
  language: 'en',
  theme: 'light',
  defaultAgent: AgentRole.GENERAL_ASSISTANT,
  autoScroll: true,
  soundEnabled: false,
  panelWidth: 420,
  showToolDetails: true,
  sessionSparkleShown: false,
};

export function ConciergeProvider({
  children,
  tenantId,
  userId,
  mallId,
}: ConciergeProviderProps) {
  const { t, i18n } = useTranslation('mall');
  const viewContextStore = useViewContext();
  const [state, setState] = useState<ConciergeUIState>({
    panelOpen: false,
    panelMinimized: false,
    activeConversationId: null,
    conversations: [],
    isLoading: false,
    isStreaming: false,
    error: null,
  });

  const [preferences, setPreferences] = useState<ConciergePreferences>(DEFAULT_PREFERENCES);
  useEffect(() => {
    const stored = localStorage.getItem('concierge_preferences');
    if (stored) {
      try { setPreferences((prev) => ({ ...prev, ...JSON.parse(stored) })); } catch { /* ignore */ }
    }
  }, []);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [activeToolExecutions, setActiveToolExecutions] = useState<ToolExecution[]>([]);
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);

  // Abort controller for stopping streams
  const abortRef = useRef<AbortController | null>(null);

  // Load conversations from API
  const refreshConversations = useCallback(async () => {
    if (tenantId === 'default') {
      setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/concierge/conversations?mallId=${mallId}`);
      if (!response.ok) {
        setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
        return;
      }
      const data = await response.json();
      setState((prev) => ({
        ...prev,
        conversations: Array.isArray(data) ? data : [],
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, conversations: [] }));
    }
  }, [tenantId, mallId]);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);

  // Panel actions
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

  // Create conversation
  const createConversation = useCallback(
    (agentRole?: AgentRole) => {
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const newConversation: Conversation = {
        id: conversationId,
        title: t('concierge.newConversation', 'New conversation'),
        tenantId,
        userId,
        agentRole: agentRole ?? (preferences.defaultAgent as AgentRole),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setActiveConversation(newConversation);
      setState((prev) => ({ ...prev, activeConversationId: conversationId, panelOpen: true }));
    },
    [tenantId, userId, preferences.defaultAgent]
  );

  // Load conversation
  const loadConversation = useCallback(
    async (conversationId: string) => {
      setState((prev) => ({ ...prev, activeConversationId: conversationId, isLoading: true }));

      try {
        const response = await fetch(`/api/concierge/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setActiveConversation({
            id: data.id,
            title: data.title,
            tenantId,
            userId,
            agentRole: AgentRole.GENERAL_ASSISTANT,
            messages: (data.messages || []).map((m: { id: string; sender: string; content: string; createdAt: string; agentRole?: string; toolCalls?: unknown; attachments?: unknown }) => ({
              id: m.id,
              conversationId: data.id,
              sender: m.sender,
              content: m.content,
              timestamp: new Date(m.createdAt),
              status: 'sent',
              agentRole: m.agentRole,
              toolExecutions: [],
              dataAttachments: m.attachments ? (m.attachments as Array<{ type: string; title: string; data: unknown }>).map((a, i) => ({
                id: `att-${i}`,
                ...a,
              })) : [],
            })),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          });
        }
      } catch {
        // ignore
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    },
    [tenantId, userId]
  );

  // Send message via HTTP SSE
  const sendMessage = useCallback(
    async (content: string) => {
      // Auto-create conversation if none active
      if (!activeConversation) {
        const router = getAgentRouter();
        const suggestion = router.route(content);
        setAgentSuggestion(suggestion);
        createConversation(suggestion.agentRole as AgentRole);
      }

      // Add user message to UI immediately
      const userMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        conversationId: activeConversation?.id ?? 'pending',
        sender: 'user',
        content,
        timestamp: new Date(),
        status: 'sent',
      };

      setActiveConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, userMessage], updatedAt: new Date() };
      });

      // Stream via SSE
      setState((prev) => ({ ...prev, isStreaming: true, error: null }));
      setStreamingMessage('');
      setActiveToolExecutions([]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/concierge/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConversation?.id?.startsWith('conv-') ? undefined : activeConversation?.id,
            mallId,
            message: content,
            language: i18n.language || preferences.language || 'en',
            viewContext: viewContextStore.value,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errText = await response.text().catch(() => '');
          console.error('[Concierge] Chat request failed', response.status, errText);
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: `Server error ${response.status}: ${errText.slice(0, 200) || 'unknown'}`,
          }));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        const attachments: DataAttachment[] = [];
        let convId = activeConversation?.id;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));

              switch (event.type) {
                case 'conversation':
                  convId = event.data?.conversationId;
                  break;

                case 'message_start':
                  if (event.data?.agentRole) {
                    setAgentSuggestion({
                      agentRole: event.data.agentRole,
                      confidence: 1,
                      reasoning: '',
                    } as AgentSuggestion);
                  }
                  break;

                case 'message_chunk':
                  fullContent += event.data?.text || '';
                  setStreamingMessage((prev) => prev + (event.data?.text || ''));
                  break;

                case 'tool_start':
                  setActiveToolExecutions((prev) => [
                    ...prev,
                    {
                      id: event.data?.toolCallId,
                      toolName: event.data?.toolName,
                      status: 'running' as const,
                      progress: 0,
                      startedAt: new Date(),
                    },
                  ]);
                  break;

                case 'tool_complete': {
                  const tcId = event.data?.toolCallId;
                  setActiveToolExecutions((prev) =>
                    prev.map((t) => t.id === tcId ? { ...t, status: 'complete' as const, progress: 100 } : t)
                  );
                  if (event.data?.attachment) {
                    attachments.push({
                      id: `att-${attachments.length}`,
                      ...event.data.attachment,
                    } as DataAttachment);
                  }
                  break;
                }

                case 'message_complete':
                  fullContent = event.data?.content || fullContent;
                  break;

                case 'error':
                  console.error('[Concierge] SSE error event', event.data);
                  setState((prev) => ({ ...prev, error: event.data?.error || 'Unknown error' }));
                  break;
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }

        // Add agent message to conversation — always add one, even if content is empty,
        // so the user sees the attachments or a fallback message
        const hasContent = fullContent || attachments.length > 0;
        if (hasContent) {
          const agentMessage: ConversationMessage = {
            id: `msg-agent-${Date.now()}`,
            conversationId: convId || activeConversation?.id || 'unknown',
            sender: 'agent',
            content: fullContent || '',
            timestamp: new Date(),
            status: 'sent',
            dataAttachments: attachments.length > 0 ? attachments : undefined,
          };

          setActiveConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              id: convId || prev.id,
              messages: [...prev.messages, agentMessage],
              updatedAt: new Date(),
            };
          });
        } else {
          console.warn('[Concierge] Stream completed with no content or attachments');
          setState((prev) => ({
            ...prev,
            error: prev.error || 'No response received from the assistant.',
          }));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped streaming
        } else {
          setState((prev) => ({ ...prev, error: 'Connection failed' }));
        }
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }));
        setStreamingMessage('');
        abortRef.current = null;
      }
    },
    [activeConversation, mallId, i18n.language, preferences.language, createConversation, viewContextStore.value]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
    setStreamingMessage('');
  }, []);

  const setActiveAgent = useCallback((agentRole: AgentRole) => {
    setActiveConversation((prev) => (prev ? { ...prev, agentRole } : prev));
    setAgentSuggestion({ agentRole, confidence: 1, reasoning: '' } as AgentSuggestion);
  }, []);

  const deleteActiveConversation = useCallback(async () => {
    const convId = activeConversation?.id;
    // If the conversation was persisted (not a client-only 'conv-...' id), archive on server
    if (convId && !convId.startsWith('conv-')) {
      try {
        await fetch(`/api/concierge/conversations/${convId}`, { method: 'DELETE' });
      } catch {
        // ignore — still clear locally
      }
    }
    abortRef.current?.abort();
    setActiveConversation(null);
    setStreamingMessage('');
    setActiveToolExecutions([]);
    setAgentSuggestion(null);
    setState((prev) => ({ ...prev, activeConversationId: null, isStreaming: false, error: null }));
    await refreshConversations();
  }, [activeConversation, refreshConversations]);

  const updatePreferences = useCallback((prefs: Partial<ConciergePreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      if (typeof window !== 'undefined') {
        localStorage.setItem('concierge_preferences', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const value: ConciergeContextValue = {
    state,
    preferences,
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
    setActiveAgent,
    deleteActiveConversation,
    updatePreferences,
    conversations: state.conversations,
    refreshConversations,
  };

  return <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>;
}

export function useConcierge() {
  const context = useContext(ConciergeContext);
  if (!context) throw new Error('useConcierge must be used within ConciergeProvider');
  return context;
}

export function useConciergeOptional() {
  return useContext(ConciergeContext);
}
