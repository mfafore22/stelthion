/**
 * Conversation Panel Component
 *
 * Main conversation view with messages and input
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useConcierge } from './ConciergeContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { AgentSuggestionBanner } from './AgentSuggestionBanner';
import { MoreVertical, Minimize2, X } from 'lucide-react';

export function ConversationPanel() {
  const {
    state,
    preferences,
    activeConversation,
    streamingMessage,
    activeToolExecutions,
    agentSuggestion,
    sendMessage,
    stopStreaming,
    closePanel,
    minimizePanel,
  } = useConcierge();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (preferences.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, streamingMessage, preferences.autoScroll]);

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full bg-gray-950">
        {/* Header */}
        <ConversationHeader
          title="Concierge"
          onMinimize={minimizePanel}
          onClose={closePanel}
        />

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Start a Conversation</h3>
            <p className="text-gray-400 mb-6">
              Ask me about sales, footfall, events, parking, or trends. I'm here to help you make
              better decisions for your mall.
            </p>
            <MessageInput placeholder="Ask me anything..." onSend={sendMessage} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <ConversationHeader
        title={activeConversation.title}
        subtitle={`Agent: ${activeConversation.agentRole.replace(/-/g, ' ')}`}
        onMinimize={minimizePanel}
        onClose={closePanel}
      />

      {/* Agent suggestion banner */}
      {agentSuggestion && (
        <AgentSuggestionBanner suggestion={agentSuggestion} />
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {activeConversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message */}
        {state.isStreaming && streamingMessage && (
          <MessageBubble
            message={{
              id: 'streaming',
              conversationId: activeConversation.id,
              sender: 'agent',
              content: '',
              timestamp: new Date(),
              status: 'streaming',
              agentRole: activeConversation.agentRole,
              toolExecutions: activeToolExecutions,
            }}
            isStreaming={true}
            streamingContent={streamingMessage}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-colors"
        >
          <span className="text-sm">↓ Scroll to bottom</span>
        </button>
      )}

      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <MessageInput
          placeholder="Type your message..."
          onSend={sendMessage}
          onStop={state.isStreaming ? stopStreaming : undefined}
          disabled={state.isStreaming}
        />
      </div>
    </div>
  );
}

/**
 * Conversation Header Component
 */
interface ConversationHeaderProps {
  title: string;
  subtitle?: string;
  onMinimize: () => void;
  onClose: () => void;
}

function ConversationHeader({ title, subtitle, onMinimize, onClose }: ConversationHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-100 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-20 min-w-[150px]">
                <button className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700">
                  Rename
                </button>
                <button className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700">
                  Export
                </button>
                <button className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700">
                  Switch Agent
                </button>
                <div className="border-t border-gray-700 my-1" />
                <button className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-gray-700">
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Minimize button */}
        <button
          onClick={onMinimize}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <Minimize2 className="w-5 h-5 text-gray-400" />
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
