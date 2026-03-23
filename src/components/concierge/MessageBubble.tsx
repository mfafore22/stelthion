/**
 * Message Bubble Component
 *
 * Displays user and agent messages in conversation
 */

'use client';

import React from 'react';
import { ConversationMessage, ToolExecution } from '@/services/concierge/types';
import { ToolExecutionPanel } from './ToolExecutionPanel';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ConversationMessage;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';
  const isSystem = message.sender === 'system';

  // Format timestamp
  const timeStr = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-700/50 text-gray-300 px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <span className="text-blue-400">ℹ️</span>
          {message.content}
          <span className="text-xs text-gray-500">{timeStr}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>

        {/* Message content */}
        <div className="flex flex-col gap-1">
          {/* Header */}
          <div className={`flex items-center gap-2 text-xs text-gray-400 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span>{isUser ? 'You' : message.agentRole?.replace(/-/g, ' ') || 'Assistant'}</span>
            <span>{timeStr}</span>
          </div>

          {/* Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm'
            }`}
          >
            {/* Tool executions (agents only) */}
            {isAgent && message.toolExecutions && message.toolExecutions.length > 0 && (
              <div className="mb-3">
                <ToolExecutionPanel executions={message.toolExecutions} />
              </div>
            )}

            {/* Message text */}
            <div className="whitespace-pre-wrap break-words">
              {isStreaming ? (
                <>
                  {streamingContent}
                  <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                </>
              ) : (
                message.content
              )}
            </div>

            {/* Data attachments */}
            {message.dataAttachments && message.dataAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.dataAttachments.map((attachment) => (
                  <div key={attachment.id} className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">{attachment.title}</div>
                    {/* TODO: Render based on attachment.type */}
                    <div className="text-xs text-gray-400">
                      {attachment.type === 'table' && 'Table data'}
                      {attachment.type === 'chart' && 'Chart visualization'}
                      {attachment.type === 'metrics' && 'Metrics data'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {message.error && (
              <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                {message.error}
              </div>
            )}
          </div>

          {/* Status indicator */}
          {message.status === 'sending' && (
            <div className={`text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>Sending...</div>
          )}
        </div>
      </div>
    </div>
  );
}
