'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PhenomenonEvidenceResponse } from '@stelthion/shoppermind-client-types';

const STRONG_SOURCE_THRESHOLD = 2;
const MAX_LINKS = 5;

export function PhenomenonSourceStrip({ phenomenonId }: { phenomenonId: string }) {
  const { t } = useTranslation('mall');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PhenomenonEvidenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (next && !data && !loading) {
      setLoading(true);
      try {
        const res = await fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/evidence`, {
          credentials: 'include',
        });
        const body = (await res.json()) as { evidence: PhenomenonEvidenceResponse | null };
        if (body.evidence) setData(body.evidence);
        else setError(t('shoppermind.evidence.strip.empty'));
      } catch {
        setError(t('shoppermind.evidence.strip.error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const linked = (data?.sources ?? []).filter((s) => s.url).slice(0, MAX_LINKS);
  const strongCount = data?.strongSourceCount ?? 0;
  const meetsBar = strongCount >= STRONG_SOURCE_THRESHOLD;

  return (
    <div className="mt-3 border-t border-bo-neutral-200/60 pt-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-[11px] text-bo-neutral-600 hover:text-bo-neutral-900"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={12} className={meetsBar || !data ? 'text-bo-success' : 'text-bo-neutral-400'} />
          {data ? t('shoppermind.evidence.strip.label', { count: strongCount }) : t('shoppermind.evidence.strip.show')}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {loading && <div className="text-[11px] text-bo-neutral-400">{t('shoppermind.evidence.strip.loading')}</div>}
          {error && <div className="text-[11px] text-bo-neutral-500">{error}</div>}
          {data && !meetsBar && (
            <div className="text-[11px] text-bo-neutral-500 italic">{t('shoppermind.evidence.strip.collecting')}</div>
          )}
          {data && meetsBar && linked.length === 0 && (
            <div className="text-[11px] text-bo-neutral-500">{t('shoppermind.evidence.strip.noUrls')}</div>
          )}
          {data && meetsBar && linked.length > 0 && (
            <ul className="space-y-1">
              {linked.map((s) => (
                <li key={s.sourceId} className="text-[11px] leading-snug">
                  <a
                    href={s.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-baseline gap-1 text-bo-primary-700 hover:text-bo-primary-900 underline decoration-bo-primary-200 hover:decoration-bo-primary-700 underline-offset-2"
                  >
                    <span className="truncate max-w-[200px]">{s.name}</span>
                    <ExternalLink size={9} className="shrink-0" />
                  </a>
                  <span className="text-bo-neutral-400 ml-1.5">· {s.type.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
