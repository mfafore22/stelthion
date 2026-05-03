'use client';

import { DatabaseZap, LockKeyhole } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentRole } from '@/lib/gcm-types';
import { useAssistantLaunch } from '@/lib/assistant-flow/useAssistantLaunch';
import { ChatBubbleButton } from '@/components/concierge/ChatBubbleButton';
import type { AssistantViewContext } from '@/lib/assistant-flow/types';

export function AssistantControlPanel({ type }: { type: 'data' | 'security' }) {
  const { t } = useTranslation('mall');
  const launch = useAssistantLaunch();
  const isSecurity = type === 'security';
  const key = isSecurity ? 'security' : 'data';
  const title = t(`assistants.panels.${key}.title`);
  const rows = [0, 1, 2, 3, 4].map((index) => t(`assistants.panels.${key}.rows.${index}`));
  const Icon = isSecurity ? LockKeyhole : DatabaseZap;
  const prompt = isSecurity
    ? t('assistants.panels.security.prompt')
    : t('assistants.panels.data.prompt');
  const viewContext: AssistantViewContext = isSecurity
    ? {
        kind: 'security_policy',
        policyId: 'assistant-security',
        label: title,
        source: 'assistants',
        returnTarget: { label: title, href: '/mall/assistants' },
      }
    : {
        kind: 'data_source',
        sourceId: 'assistant-data',
        label: title,
        source: 'assistants',
        returnTarget: { label: title, href: '/mall/assistants' },
      };

  return (
    <section className="bo-surface rounded-2xl border-2 border-bo-neutral-200 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
        <Icon size={17} className="text-bo-primary-700" />
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((row) => <div key={row} className="bo-surface-subtle rounded-lg border p-2 text-xs text-bo-neutral-700">{row}</div>)}
      </div>
      <ChatBubbleButton
        onClick={() => launch({
          agentRole: AgentRole.GENERAL_ASSISTANT,
          starterPrompt: prompt,
          viewContext,
        })}
        tone={isSecurity ? 'primary' : 'teal'}
        className="mt-3"
      >
        {t('assistants.actions.askInChat')}
      </ChatBubbleButton>
    </section>
  );
}
