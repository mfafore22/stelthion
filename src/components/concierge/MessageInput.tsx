/**
 * Message Input Component
 *
 * Text input for sending messages
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';

interface MessageInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  placeholder = 'Type your message...',
  onSend,
  onStop,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea; show scrollbar only when capped at max height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = newHeight >= 200 ? 'auto' : 'hidden';
    }
  };

  return (
    <div className="flex items-end gap-2">
      {/* Attachment button (disabled for now) */}
      <button
        disabled
        className="p-2 text-bo-neutral-400 transition-colors disabled:opacity-40"
        title="Attachments (coming soon)"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Text input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 bg-bo-neutral-50 border border-bo-neutral-300 rounded-lg text-bo-neutral-950 placeholder-bo-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-bo-primary-600 focus:ring-opacity-20 focus:border-bo-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px', maxHeight: '200px', overflowY: 'hidden' }}
        />
      </div>

      {/* Voice button (disabled for now) */}
      <button
        disabled
        className="p-2 text-bo-neutral-400 transition-colors disabled:opacity-40"
        title="Voice input (coming soon)"
      >
        <Mic className="w-5 h-5" />
      </button>

      {/* Send or Stop button */}
      {onStop && disabled ? (
        <button
          onClick={onStop}
          className="p-3 bg-bo-neutral-950 hover:bg-bo-neutral-900 text-bo-neutral-50 rounded-lg transition-colors"
          title="Stop generating"
        >
          <Square className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-3 bg-bo-neutral-950 hover:bg-bo-neutral-900 text-bo-neutral-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
