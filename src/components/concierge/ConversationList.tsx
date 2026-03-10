/**
 * Conversation List Component
 *
 * Shows recent conversations and new conversation button
 */

'use client';

import React, { useState } from 'react';
import { useConcierge } from './ConciergeContext';
import { AgentSelectionModal } from './AgentSelectionModal';
import { MessageSquare, Plus, X, Minimize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ConversationList() {
  const { state, conversations, loadConversation, closePanel, minimizePanel } = useConcierge();
  const [showAgentSelection, setShowAgentSelection] = useState(false);

  const handleNewConversation = () => {
    setShowAgentSelection(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">CONCIERGE</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={minimizePanel}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={closePanel}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </button>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-2 text-xs font-semibold text-gray-400 uppercase">Recent</div>

        {state.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No conversations yet.
            <br />
            Start a new one!
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
          <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All Conversations →
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-500">
        <div>Agent: General Assistant 🤖</div>
        <div className="mt-1">Tenant: Tripla</div>
      </div>

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
      className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors group"
    >
      {/* Title and time */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg flex-shrink-0">{agentIcon}</span>
          <h3 className="text-sm font-medium text-gray-200 truncate">{conversation.title}</h3>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
      </div>

      {/* Agent role */}
      <div className="text-xs text-gray-400 mb-2">Agent: {conversation.agentRole.replace(/-/g, ' ')}</div>

      {/* Preview */}
      <p className="text-sm text-gray-500 line-clamp-2 mb-2">"{conversation.preview}"</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span>{conversation.messageCount} messages</span>
        <span>•</span>
        <span>{conversation.toolsUsed} tools used</span>
      </div>
    </button>
  );
}
