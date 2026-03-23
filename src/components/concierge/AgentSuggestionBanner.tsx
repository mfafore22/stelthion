/**
 * Agent Suggestion Banner Component
 *
 * Displays agent routing suggestion with reasoning
 */

'use client';

import React from 'react';
import { AgentSuggestion } from '@/services/concierge/types';
import { Sparkles, Info } from 'lucide-react';

interface AgentSuggestionBannerProps {
  suggestion: AgentSuggestion;
  onDismiss?: () => void;
}

export function AgentSuggestionBanner({ suggestion, onDismiss }: AgentSuggestionBannerProps) {
  const confidencePercent = Math.round(suggestion.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80 ? 'text-green-400' : confidencePercent >= 60 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className="mx-4 mt-4 mb-2 bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-300">Agent Selected</span>
            <span className={`text-xs ${confidenceColor}`}>{confidencePercent}% confident</span>
          </div>

          <p className="text-sm text-gray-300">{suggestion.reasoning}</p>

          {/* Alternative agents */}
          {suggestion.alternativeAgents && suggestion.alternativeAgents.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <Info className="w-3 h-3" />
              <span>
                Alternatives: {suggestion.alternativeAgents.map((a) => a.agentRole).join(', ')}
              </span>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
