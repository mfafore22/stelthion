'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, DatabaseZap, FileSearch, LockKeyhole, ShieldCheck, Workflow } from 'lucide-react';

const AGENTS = ['trend', 'campaign', 'operations'] as const;
const GUARDS = ['scope', 'sources', 'approval', 'audit'] as const;
const DATA = ['rag', 'pos', 'footfall', 'tenant'] as const;

export function AssistantsView() {
  const { t } = useTranslation('mall');

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border-2 border-bo-primary-200/60 bg-white p-6 shadow-bo-glass">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bo-primary-100">
            <ShieldCheck className="h-6 w-6 text-bo-primary-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">
                {t('assistants.controlTitle')}
              </h2>
              <span className="rounded-md bg-bo-success-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bo-success-dark">
                {t('assistants.closedEnvironment')}
              </span>
            </div>
            <p className="max-w-4xl text-sm leading-relaxed text-bo-neutral-700">
              {t('assistants.controlBody')}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel icon={Bot} title={t('assistants.agentCatalog')}>
          {AGENTS.map((agent) => (
            <Row key={agent} title={t(`assistants.agents.${agent}.title`)} body={t(`assistants.agents.${agent}.body`)} />
          ))}
        </Panel>
        <Panel icon={LockKeyhole} title={t('assistants.securityTitle')}>
          {GUARDS.map((guard) => (
            <Row key={guard} title={t(`assistants.guards.${guard}.title`)} body={t(`assistants.guards.${guard}.body`)} />
          ))}
        </Panel>
        <Panel icon={DatabaseZap} title={t('assistants.dataTitle')}>
          {DATA.map((item) => (
            <Row key={item} title={t(`assistants.data.${item}.title`)} body={t(`assistants.data.${item}.body`)} />
          ))}
        </Panel>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-bo-neutral-200 bg-white p-4 shadow-bo-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
            <FileSearch size={16} className="text-bo-primary-700" />
            {t('assistants.ragTitle')}
          </div>
          <p className="text-sm leading-relaxed text-bo-neutral-600">{t('assistants.ragBody')}</p>
        </div>
        <div className="rounded-xl border border-bo-neutral-200 bg-white p-4 shadow-bo-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
            <Workflow size={16} className="text-bo-primary-700" />
            {t('assistants.workflowTitle')}
          </div>
          <p className="text-sm leading-relaxed text-bo-neutral-600">{t('assistants.workflowBody')}</p>
        </div>
      </section>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bot;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-bo-neutral-200 bg-white p-5 shadow-bo-glass">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
        <Icon size={15} />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-bo-neutral-200 bg-bo-neutral-50 p-3">
      <div className="text-sm font-semibold text-bo-neutral-950">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-bo-neutral-600">{body}</div>
    </div>
  );
}
