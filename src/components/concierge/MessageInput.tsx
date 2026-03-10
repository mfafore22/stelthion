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

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2">
      {/* Attachment button (disabled for now) */}
      <button
        disabled
        className="p-2 text-gray-500 hover:text-gray-400 transition-colors disabled:opacity-50"
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
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />
      </div>

      {/* Voice button (disabled for now) */}
      <button
        disabled
        className="p-2 text-gray-500 hover:text-gray-400 transition-colors disabled:opacity-50"
        title="Voice input (coming soon)"
      >
        <Mic className="w-5 h-5" />
      </button>

      {/* Send or Stop button */}
      {onStop && disabled ? (
        <button
          onClick={onStop}
          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          title="Stop generating"
        >
          <Square className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
