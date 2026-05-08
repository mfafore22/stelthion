'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import type { PhenomenonEvidenceResponse } from '@stelthion/shoppermind-client-types';
import { SectionCard } from './SectionCard';

interface Response {
  configured: boolean;
  evidence: PhenomenonEvidenceResponse | null;
  error?: string;
}

export function EvidencePanel({ phenomenonId }: { phenomenonId: string }) {
  const { t } = useTranslation('mall');
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/evidence`, { credentials: 'include' })
      .then((res) => res.json() as Promise<Response>)
      .then((body) => { if (!cancelled) setData(body); })
      .catch(() => { if (!cancelled) setData({ configured: false, evidence: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phenomenonId]);

  if (loading) {
    return (
      <SectionCard icon={ShieldCheck} title={t('shoppermind.evidence.title')} accent="accent">
        <div className="text-xs text-bo-neutral-400 animate-pulse">{t('shoppermind.loading')}</div>
      </SectionCard>
    );
  }
  if (!data?.configured || !data.evidence) {
    return (
      <SectionCard icon={ShieldCheck} title={t('shoppermind.evidence.title')} accent="accent">
        <div className="text-xs text-bo-neutral-500">{t('shoppermind.evidence.empty')}</div>
      </SectionCard>
    );
  }
  const ev = data.evidence;
  const confidencePct = Math.round(ev.confidence * 100);

  return (
    <SectionCard icon={ShieldCheck} title={t('shoppermind.evidence.title')} accent="accent">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-bo-neutral-500">
          {t('shoppermind.evidence.confidence')}
        </span>
        <span className="text-2xl font-semibold text-bo-neutral-900 tabular-nums">{confidencePct}%</span>
      </div>
      <ul className="text-xs text-bo-neutral-600 space-y-1 mb-4" aria-label={t('shoppermind.evidence.componentsLabel')}>
        <li className="flex justify-between">
          <span>{t('shoppermind.evidence.strongSources')}</span>
          <span className="tabular-nums font-medium text-bo-neutral-900">{ev.strongSourceCount}</span>
        </li>
        <li className="flex justify-between">
          <span>{t('shoppermind.evidence.corroboratedIn')}</span>
          <span className="tabular-nums font-medium text-bo-neutral-900">{ev.crossMarketCount}</span>
        </li>
      </ul>
      {ev.sources.length > 0 && (
        <ol className="space-y-2" aria-label={t('shoppermind.evidence.sourceList')}>
          {ev.sources.slice(0, 6).map((s) => (
            <li key={s.sourceId} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-bo-neutral-800">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-bo-primary inline-flex items-center gap-1">
                    {s.name}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  s.name
                )}
              </span>
              <span className="tabular-nums text-bo-neutral-500 shrink-0">w {s.weight.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
