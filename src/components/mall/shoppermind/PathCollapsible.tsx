'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MegaPath } from '@/lib/shoppermind/megaScenario';
import { PathBody } from './PathBody';

const TONE_BORDER: Record<string, string> = {
  neutraali: 'border-bo-neutral-300', neutral: 'border-bo-neutral-300',
  synkkä: 'border-bo-error/60', dark: 'border-bo-error/60',
  valoisa: 'border-bo-success/60', bright: 'border-bo-success/60',
};
const TONE_CHIP: Record<string, string> = {
  neutraali: 'bg-bo-neutral-100 text-bo-neutral-700', neutral: 'bg-bo-neutral-100 text-bo-neutral-700',
  synkkä: 'bg-bo-error-light text-bo-error-dark', dark: 'bg-bo-error-light text-bo-error-dark',
  valoisa: 'bg-bo-success-light text-bo-success-dark', bright: 'bg-bo-success-light text-bo-success-dark',
};

function toneLabel(t: (k: string) => string, tone: string): string {
  if (tone === 'neutraali' || tone === 'neutral') return t('shoppermind.megaScenario.pathToneNeutral');
  if (tone === 'synkkä' || tone === 'dark') return t('shoppermind.megaScenario.pathToneDark');
  if (tone === 'valoisa' || tone === 'bright') return t('shoppermind.megaScenario.pathToneBright');
  return tone;
}

export function PathCollapsible({ path, selected }: { path: MegaPath; selected?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('mall');
  const border = TONE_BORDER[path.tone] ?? 'border-bo-neutral-300';
  const chip = TONE_CHIP[path.tone] ?? 'bg-bo-neutral-100 text-bo-neutral-700';
  const heroNumbers = (path.keyNumbers ?? []).slice(0, 2);
  const visibleOpen = open || selected;

  return (
    <article
      id={`shoppermind-path-${path.id}`}
      className={`bo-surface-subtle bo-surface-hover mb-2.5 rounded-xl border ${border} ${selected ? 'ring-2 ring-bo-primary-300' : ''}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={visibleOpen}
        className="w-full flex items-start justify-between gap-3 rounded-xl p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-bo-neutral-950">{path.title}</h4>
            <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${chip}`}>
              {toneLabel(t, path.tone)}
            </span>
          </div>
          {!visibleOpen && (
            <>
              <p className="text-xs text-bo-neutral-600 leading-snug line-clamp-2">{path.summary}</p>
              {heroNumbers.length > 0 && (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {heroNumbers.map((n, i) => (
                    <span key={i} className="text-[11px] text-bo-neutral-700">
                      <strong className="text-bo-neutral-950 tabular-nums">{n.value}</strong>
                      <span className="text-bo-neutral-500 ml-1">{n.label.toLowerCase()}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <ChevronDown size={16} className={`text-bo-neutral-400 shrink-0 mt-0.5 transition-transform ${visibleOpen ? 'rotate-180' : ''}`} />
      </button>
      {visibleOpen && (
        <div className="px-3 pb-3 pt-0">
          <PathBody path={path} />
        </div>
      )}
    </article>
  );
}
