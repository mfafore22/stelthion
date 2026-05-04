/**
 * Conversation Panel Component
 *
 * Main conversation view with property greeting, messages,
 * quick action chips, and specialist indicator.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useConcierge } from './ConciergeContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { PropertyGreeting } from './PropertyGreeting';
import { QuickActionChips } from './QuickActionChips';
import { SpecialistIndicator } from './SpecialistIndicator';
import { ViewContextChip } from './ViewContextChip';
import { TrendGreeting } from './TrendGreeting';
import { ConciergeBanner } from './ConciergeBanner';
import { useViewContext } from '@/lib/shoppermind/view-context';
import { PropertySegmentedSelector } from '@/components/mall/shoppermind/PropertySegmentedSelector';
import { Bot, MoreVertical, Minimize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    deleteActiveConversation,
    propertyName,
    propertyLogoUrl,
    mallId,
    mallOptions,
    setMallFocus,
  } = useConcierge();
  const { t } = useTranslation('mall');
  const { value: viewContext } = useViewContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (preferences.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, streamingMessage, preferences.autoScroll]);

  // Handle scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  // Empty state: no active conversation or no messages
  if (!activeConversation || !hasMessages) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <ConversationHeader
          title={t('topbar.concierge', 'Concierge')}
          onMinimize={minimizePanel}
          onClose={closePanel}
          onDelete={deleteActiveConversation}
        />
        <ConciergeBanner title={t('topbar.concierge', 'Concierge')} />
        <MallFocusSelector
          options={mallOptions}
          value={mallId}
          onChange={setMallFocus}
        />

        {/* Greeting — trend-aware if viewing a ShopperMind trend, else generic */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {viewContext?.kind === 'shoppermind_trend' ? (
            <TrendGreeting />
          ) : (
            <PropertyGreeting propertyName={propertyName} logoUrl={propertyLogoUrl} />
          )}
        </div>

        {/* Quick action chips + input */}
        <div className="border-t border-bo-neutral-200/60 flex flex-col">
          <ViewContextChip />
          <QuickActionChips onSend={sendMessage} disabled={state.isStreaming} />
          <div className="px-4 pb-4">
            <MessageInput
              placeholder={t('concierge.askAnything', 'Ask anything...')}
              onSend={sendMessage}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with specialist indicator */}
      <ConversationHeader
        title={activeConversation.title}
        agentRole={agentSuggestion?.agentRole || activeConversation.agentRole}
        onMinimize={minimizePanel}
        onClose={closePanel}
        onDelete={deleteActiveConversation}
      />
      <ConciergeBanner title={t('topbar.concierge', 'Concierge')} />
      <MallFocusSelector
        options={mallOptions}
        value={mallId}
        onChange={setMallFocus}
      />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {activeConversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message — show during tool execution even without text */}
        {state.isStreaming && (
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

        {/* Error display */}
        {state.error && !state.isStreaming && (
          <div className="mx-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-6 bg-bo-neutral-950 hover:bg-bo-neutral-900 text-bo-neutral-50 rounded-full px-3 py-1.5 shadow-bo-md transition-colors text-xs"
        >
          ↓
        </button>
      )}

      {/* Quick action chips + input */}
      <div className="border-t border-bo-neutral-200/60">
        <QuickActionChips onSend={sendMessage} disabled={state.isStreaming} />
        <div className="px-4 pb-4">
          <MessageInput
            placeholder={t('concierge.typeMessage', 'Type a message...')}
            onSend={sendMessage}
            onStop={state.isStreaming ? stopStreaming : undefined}
            disabled={state.isStreaming}
          />
        </div>
      </div>
    </div>
  );
}

function MallFocusSelector({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; name: string }>;
  value: string;
  onChange: (mallId: string) => void;
}) {
  const { t } = useTranslation('mall');
  if (options.length <= 1) return null;
  return (
    <div className="border-b border-bo-neutral-200/60 px-4 py-3">
      <PropertySegmentedSelector
        label={t('assistants.mallFocus')}
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * Conversation Header
 */
interface ConversationHeaderProps {
  title: string;
  subtitle?: string;
  agentRole?: string;
  onMinimize: () => void;
  onClose: () => void;
  onDelete?: () => void | Promise<void>;
}

function ConversationHeader({ title, subtitle, agentRole, onMinimize, onClose, onDelete }: ConversationHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation('mall');

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-bo-neutral-200/60 bg-white/60 backdrop-blur-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-bo-neutral-950 truncate">{title}</h2>
          <SpecialistIndicator agentRole={agentRole} />
        </div>
        {subtitle && <p className="text-xs text-bo-neutral-500 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/mall/assistants"
          className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
          title={t('assistants.title', 'Assistants')}
        >
          <Bot className="w-4 h-4 text-bo-neutral-400" />
        </Link>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-bo-neutral-400" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-12 top-12 bg-white/95 backdrop-blur-md border border-bo-neutral-200 rounded-lg shadow-bo-lg py-1 z-20 min-w-[150px]">
              <button className="w-full px-4 py-2 text-sm text-left text-bo-neutral-700 hover:bg-bo-neutral-50 transition-colors">
                {t('concierge.menu.rename', 'Rename')}
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-bo-neutral-700 hover:bg-bo-neutral-50 transition-colors">
                {t('concierge.menu.export', 'Export')}
              </button>
              <div className="border-t border-bo-neutral-200 my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete?.();
                }}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                {t('concierge.menu.delete', 'Delete')}
              </button>
            </div>
          </>
        )}

        <button
          onClick={onMinimize}
          className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
        >
          <Minimize2 className="w-4 h-4 text-bo-neutral-400" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-bo-neutral-400" />
        </button>
      </div>
    </div>
  );
}
