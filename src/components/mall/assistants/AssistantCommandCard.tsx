'use client';

import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssistantLaunch } from '@/lib/assistant-flow/useAssistantLaunch';
import { ChatBubbleButton } from '@/components/concierge/ChatBubbleButton';
import type { AssistantDemoCard } from './assistantCatalog';

function promptsFor(t: ReturnType<typeof useTranslation>['t'], id: string): string[] {
  return [0, 1].map((index) => t(`assistants.demo.${id}.prompts.${index}`));
}

const toneClasses = {
  primary: {
    card: 'border-bo-primary-200/80 bg-bo-primary-50/25',
    icon: 'bg-bo-primary-100 text-bo-primary-700',
    tool: 'border-bo-primary-200/70 bg-bo-primary-50/70 text-bo-primary-800',
  },
  teal: {
    card: 'border-teal-200/80 bg-teal-50/35',
    icon: 'bg-teal-100 text-teal-700',
    tool: 'border-teal-200/70 bg-teal-50/80 text-teal-800',
  },
  amber: {
    card: 'border-amber-200/80 bg-amber-50/35',
    icon: 'bg-amber-100 text-amber-700',
    tool: 'border-amber-200/70 bg-amber-50/80 text-amber-800',
  },
  violet: {
    card: 'border-violet-200/80 bg-violet-50/35',
    icon: 'bg-violet-100 text-violet-700',
    tool: 'border-violet-200/70 bg-violet-50/80 text-violet-800',
  },
};

export function AssistantCommandCard({ item }: { item: AssistantDemoCard }) {
  const { t } = useTranslation('mall');
  const launch = useAssistantLaunch();
  const title = t(`assistants.demo.${item.id}.title`);
  const prompts = promptsFor(t, item.id);

  const start = (prompt = prompts[0]) => launch({
    agentRole: item.agentRole,
    starterPrompt: prompt,
    viewContext: {
      kind: 'assistant',
      assistantId: item.id,
      label: title,
      source: 'assistants',
      returnTarget: { label: title, href: '/mall/assistants' },
    },
  });
  const tone = toneClasses[item.tone];

  return (
    <article className={`bo-surface bo-surface-hover flex h-full flex-col rounded-xl border-2 p-4 ${tone.card}`}>
      <div className="flex min-h-[132px] items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="min-h-[44px] text-base font-semibold leading-snug text-bo-neutral-950">{title}</h3>
          <p className="mt-1 min-h-[66px] text-sm leading-relaxed text-bo-neutral-600">{t(`assistants.demo.${item.id}.body`)}</p>
        </div>
      </div>
      <div className="mb-3 flex min-h-[54px] flex-wrap content-start gap-1.5">
        {item.tools.map((tool, index) => (
          <span key={tool} className={`rounded-full border px-2 py-1 text-[11px] font-medium ${tone.tool}`}>
            {t(`assistants.demo.${item.id}.tools.${index}`)}
          </span>
        ))}
      </div>
      <ChatBubbleButton onClick={() => start()} tone={item.tone} className="w-fit">
        {t('assistants.actions.startChat')}
      </ChatBubbleButton>
      <div className="mt-3 space-y-1.5">
        {prompts.map((prompt) => (
          <button key={prompt} onClick={() => start(prompt)} className="block text-left text-xs leading-snug text-bo-primary-700 hover:text-bo-primary-900">
            {prompt}
          </button>
        ))}
      </div>
    </article>
  );
}
