/**
 * Message Bubble Component
 *
 * Displays user and agent messages with light theme styling.
 * Supports rich attachment cards (weather, footfall, events, etc.)
 */

'use client';

import React from 'react';
import { ConversationMessage, ToolExecution } from '@/services/concierge/types';
import { ToolExecutionPanel } from './ToolExecutionPanel';
import { Bot, User } from 'lucide-react';
import { WeatherCard } from './attachments/WeatherCard';
import { FootfallSparkline } from './attachments/FootfallSparkline';
import { EventCard } from './attachments/EventCard';
import { ParkingStatusCard } from './attachments/ParkingStatusCard';
import { TransportCard } from './attachments/TransportCard';

interface MessageBubbleProps {
  message: ConversationMessage;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';
  const isSystem = message.sender === 'system';

  const timeStr = new Date(message.timestamp).toLocaleTimeString('fi-FI', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-bo-neutral-100/60 text-bo-neutral-600 px-4 py-2 rounded-full text-xs flex items-center gap-2">
          {message.content}
          <span className="text-bo-neutral-400">{timeStr}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isUser ? 'bg-bo-primary-500' : 'bg-bo-primary-100'
          }`}
        >
          {isUser
            ? <User className="w-4 h-4 text-white" />
            : <Bot className="w-4 h-4 text-bo-primary-700" />
          }
        </div>

        {/* Message content */}
        <div className="flex flex-col gap-0.5">
          {/* Header */}
          <div className={`flex items-center gap-2 text-[10px] text-bo-neutral-400 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span>{isUser ? 'You' : message.agentRole?.replace(/-/g, ' ') || 'Ideapark'}</span>
            <span>{timeStr}</span>
          </div>

          {/* Bubble */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-bo-primary-500 text-white rounded-tr-sm'
                : 'bg-bo-neutral-100 text-bo-neutral-900 rounded-tl-sm'
            }`}
          >
            {/* Tool executions (agents only) */}
            {isAgent && message.toolExecutions && message.toolExecutions.length > 0 && (
              <div className="mb-2">
                <ToolExecutionPanel executions={message.toolExecutions} />
              </div>
            )}

            {/* Message text */}
            <div className="whitespace-pre-wrap break-words">
              {isStreaming ? (
                <>
                  {streamingContent}
                  <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-current animate-pulse rounded-full" />
                </>
              ) : (
                message.content
              )}
            </div>

            {/* Data attachments */}
            {message.dataAttachments && message.dataAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.dataAttachments.map((attachment) => (
                  <AttachmentRenderer key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}

            {/* Error state */}
            {message.error && (
              <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span>
                {message.error}
              </div>
            )}
          </div>

          {/* Status */}
          {message.status === 'sending' && (
            <div className={`text-[10px] text-bo-neutral-400 ${isUser ? 'text-right' : 'text-left'}`}>
              Sending...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the appropriate card component based on attachment type
 */
function AttachmentRenderer({ attachment }: { attachment: { id: string; type: string; title: string; data?: unknown } }) {
  switch (attachment.type) {
    case 'weather_card':
      return <WeatherCard data={attachment.data} title={attachment.title} />;
    case 'footfall_sparkline':
      return <FootfallSparkline data={attachment.data} title={attachment.title} />;
    case 'event_card':
      return <EventCard data={attachment.data} title={attachment.title} />;
    case 'parking_status':
      return <ParkingStatusCard data={attachment.data} title={attachment.title} />;
    case 'transport_card':
      return <TransportCard data={attachment.data} title={attachment.title} />;
    default:
      return (
        <div className="bg-bo-neutral-50 rounded-lg p-2 text-xs text-bo-neutral-500">
          {attachment.title} ({attachment.type})
        </div>
      );
  }
}
