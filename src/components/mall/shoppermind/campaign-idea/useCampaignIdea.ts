'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CampaignIdea } from '@stelthion/shoppermind-client-types';

export interface UseCampaignIdeaArgs {
  phenomenonId: string;
  mallId: string | null | undefined;
}

interface State {
  idea: CampaignIdea | null;
  loading: boolean;
  error: string | null;
}

export function useCampaignIdea({ phenomenonId, mallId }: UseCampaignIdeaArgs) {
  const { i18n } = useTranslation('mall');
  const [state, setState] = useState<State>({ idea: null, loading: false, error: null });

  const generate = useCallback(
    async (overrides?: { angle?: string; budget?: 'light' | 'standard' | 'premium' }) => {
      if (!mallId) return;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const lang = (i18n.language?.split('-')[0] ?? 'en') as 'fi' | 'en' | 'sv';
        const language: 'fi' | 'en' | 'sv' = ['fi', 'en', 'sv'].includes(lang) ? lang : 'en';
        const res = await fetch(
          `/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/campaign-idea`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mallId, language, ...overrides }),
          },
        );
        if (!res.ok) {
          setState({ idea: null, loading: false, error: `error_${res.status}` });
          return;
        }
        const data = (await res.json()) as { idea: CampaignIdea | null; error?: string };
        if (!data.idea) {
          setState({ idea: null, loading: false, error: data.error ?? 'no_idea' });
          return;
        }
        setState({ idea: data.idea, loading: false, error: null });
      } catch (err) {
        setState({
          idea: null,
          loading: false,
          error: err instanceof Error ? err.message : 'fetch_failed',
        });
      }
    },
    [phenomenonId, mallId, i18n.language],
  );

  const reset = useCallback(() => {
    setState({ idea: null, loading: false, error: null });
  }, []);

  return { ...state, generate, reset };
}
