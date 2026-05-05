'use client';

import { useCallback } from 'react';
import { useConcierge } from '@/components/concierge/ConciergeContext';
import { useViewContext } from '@/lib/shoppermind/view-context';
import type { AssistantLaunch } from './types';

const DRAFT_KEY = 'concierge_draft_message';

function setDraft(prompt: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DRAFT_KEY, prompt);
  window.dispatchEvent(new CustomEvent('concierge:draft-message', { detail: prompt }));
}

export function useAssistantLaunch() {
  const concierge = useConcierge();
  const viewContext = useViewContext();

  return useCallback((launch: AssistantLaunch) => {
    viewContext.setValue(launch.viewContext);
    if (launch.targetMallId) concierge.setMallFocus(launch.targetMallId);
    concierge.createConversation(launch.agentRole);
    concierge.setActiveAgent(launch.agentRole);
    concierge.openPanel();
    setDraft(launch.starterPrompt);
  }, [concierge, viewContext]);
}

export { DRAFT_KEY };
