/**
 * Conversation List Component
 *
 * Shows recent conversations and new conversation button
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useConcierge } from './ConciergeContext';
import { AgentSelectionModal } from './AgentSelectionModal';
import { Plus, X, Minimize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from 'react-i18next';

export function ConversationList() {
  const { state, conversations, loadConversation, closePanel, minimizePanel } = useConcierge();
  const { user } = useSession();
  const { t } = useTranslation('mall');
  const [showAgentSelection, setShowAgentSelection] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bo-neutral-200 bg-white">
        <div className="flex items-center gap-2">
          <Image
            src="/stelthion-brandmark.png"
            alt="Stelthion"
            width={28}
            height={28}
            className="object-contain"
          />
          <h2 className="text-sm font-semibold text-bo-neutral-950 tracking-tight">
            {t('topbar.concierge')}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={minimizePanel}
            className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
            aria-label="Minimise"
          >
            <Minimize2 className="w-4 h-4 text-bo-neutral-500" />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 hover:bg-bo-neutral-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-bo-neutral-500" />
          </button>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={() => setShowAgentSelection(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bo-neutral-950 hover:bg-bo-neutral-900 text-bo-neutral-50 rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('concierge.newConversation')}
        </button>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-2 text-xs font-semibold text-bo-neutral-500 uppercase tracking-wider">
          {t('concierge.recent')}
        </div>

        {state.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-bo-neutral-500 text-sm">{t('concierge.loading')}</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-bo-neutral-500 text-sm">
            {t('concierge.noConversations')}
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onClick={() => loadConversation(conv.id)}
              />
            ))}
          </div>
        )}

        {conversations.length > 3 && (
          <button className="w-full mt-4 py-2 text-sm text-bo-primary-600 hover:text-bo-primary-700 transition-colors">
            {t('concierge.viewAll')} →
          </button>
        )}
      </div>

      {/* Footer — tenant from session, no hardcoded names */}
      {user && (
        <div className="border-t border-bo-neutral-200 px-4 py-3 text-xs text-bo-neutral-500 bg-white">
          <div className="font-medium text-bo-neutral-700">{user.mallDisplayName}</div>
          <div className="mt-0.5 text-bo-neutral-400">{user.userId}</div>
        </div>
      )}

      {/* Agent Selection Modal */}
      {showAgentSelection && (
        <AgentSelectionModal onClose={() => setShowAgentSelection(false)} />
      )}
    </div>
  );
}

/**
 * Conversation Card Component
 */
interface ConversationCardProps {
  conversation: {
    id: string;
    title: string;
    agentRole: string;
    preview: string;
    messageCount: number;
    toolsUsed: number;
    lastMessageAt: Date;
  };
  onClick: () => void;
}

function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true });

  const agentIcon = {
    'sales-optimizer': '📊',
    'footfall-analyst': '🚶',
    'event-coordinator': '🎉',
    'parking-manager': '🅿️',
    'trend-analyst': '📈',
    'general-assistant': '🤖',
  }[conversation.agentRole] || '🤖';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-white hover:bg-bo-neutral-50 border border-bo-neutral-200 rounded-lg transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">{agentIcon}</span>
          <h3 className="text-sm font-medium text-bo-neutral-950 truncate">{conversation.title}</h3>
        </div>
        <span className="text-xs text-bo-neutral-400 flex-shrink-0">{timeAgo}</span>
      </div>

      <div className="text-xs text-bo-neutral-500 mb-2 capitalize">
        {conversation.agentRole.replace(/-/g, ' ')}
      </div>

      <p className="text-sm text-bo-neutral-600 line-clamp-2 mb-2">"{conversation.preview}"</p>

      <div className="flex items-center gap-3 text-xs text-bo-neutral-400">
        <span>{conversation.messageCount} messages</span>
        <span>·</span>
        <span>{conversation.toolsUsed} tools</span>
      </div>
    </button>
  );
}
