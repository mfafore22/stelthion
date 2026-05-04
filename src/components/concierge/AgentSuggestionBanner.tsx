/**
 * Agent Suggestion Banner Component
 *
 * Displays agent routing suggestion with reasoning
 */

'use client';

import React from 'react';
import { AgentSuggestion } from '@/services/concierge/types';
import { Sparkles, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgentSuggestionBannerProps {
  suggestion: AgentSuggestion;
  onDismiss?: () => void;
}

export function AgentSuggestionBanner({ suggestion, onDismiss }: AgentSuggestionBannerProps) {
  const { t } = useTranslation('mall');
  const confidencePercent = Math.round(suggestion.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80 ? 'text-bo-success-dark' : confidencePercent >= 60 ? 'text-bo-warning-dark' : 'text-bo-accent-700';

  return (
    <div className="bo-surface-subtle bo-surface-hover mx-4 mt-4 mb-2 overflow-hidden rounded-xl border border-bo-primary-200/50 shadow-bo-glass">
      <div className="h-1.5 bg-gradient-to-r from-bo-primary-700 via-bo-info-dark to-bo-success-dark" />
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-bo-primary-700 flex-shrink-0 mt-3 ml-3" />

        <div className="flex-1 min-w-0 p-3 pl-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-bo-neutral-950">{t('concierge.assistantSelected')}</span>
            <span className={`text-xs ${confidenceColor}`}>{t('concierge.confidence', { percent: confidencePercent })}</span>
          </div>

          <p className="text-sm text-bo-neutral-600">{suggestion.reasoning}</p>

          {suggestion.alternativeAgents && suggestion.alternativeAgents.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-bo-neutral-500">
              <Info className="w-3 h-3" />
              <span>
                {t('concierge.alternativeAssistants')}: {suggestion.alternativeAgents.map((a) => a.agentRole.replace(/-/g, ' ')).join(', ')}
              </span>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-3 mr-3 text-bo-neutral-400 hover:text-bo-neutral-700 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
