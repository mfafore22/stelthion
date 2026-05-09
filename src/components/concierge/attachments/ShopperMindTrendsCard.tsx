'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AttachmentShell } from './AttachmentShell';

const FALLBACKS: Record<string, { open: string; empty: string }> = {
  fi: { open: 'Avaa trendinäkymä', empty: 'Ei seurattuja ilmiöitä vielä.' },
  sv: { open: 'Öppna trendvyn', empty: 'Inga spårade fenomen ännu.' },
  en: { open: 'Open trends view', empty: 'No tracked phenomena yet.' },
};

interface Phenomenon {
  id: string;
  label: string;
  description: string;
  state: string;
  compositeScore: number;
  i18n?: Record<string, { label?: string; summary?: string; description?: string } | undefined>;
}

function localized(p: Phenomenon, lang: string): { label: string; description: string } {
  const block = p.i18n?.[lang];
  return {
    label: block?.label || p.label,
    description: block?.description || block?.summary || p.description,
  };
}

interface ShopperMindTrendsData {
  country: string;
  marketId: string;
  phenomena?: Phenomenon[];
  signalOfTheDay?: string;
}

const MAX_DESC = 160;
const MAX_SOTD = 220;

function tighten(text: string, max: number): string {
  const firstBlock = text.split(/\n\n+/)[0]?.trim() ?? text;
  if (firstBlock.length <= max) return firstBlock;
  return firstBlock.slice(0, max).trimEnd() + '…';
}

export function ShopperMindTrendsCard({ data, title }: { data: unknown; title: string }) {
  const { i18n } = useTranslation('mall');
  const lang = (i18n.language ?? 'en').slice(0, 2).toLowerCase();
  const labels = FALLBACKS[lang] ?? FALLBACKS.en!;
  const payload = (data ?? {}) as ShopperMindTrendsData;
  const phenomena = (payload.phenomena ?? []).slice(0, 5);
  const isEmpty = phenomena.length === 0 && !payload.signalOfTheDay;

  return (
    <AttachmentShell title={title}>
      {isEmpty && <p className="text-sm text-bo-neutral-600">{labels.empty}</p>}
      {phenomena.length > 0 && (
        <ol className="space-y-2 text-sm">
          {phenomena.map((p) => {
            const { label, description } = localized(p, lang);
            return (
              <li key={p.id}>
                <Link
                  href={`/mall/shoppermind/phenomenon/${encodeURIComponent(p.id)}`}
                  className="group block rounded-lg border border-bo-neutral-200/70 bg-bo-neutral-50/50 p-3 transition hover:border-bo-primary-300 hover:bg-bo-primary-50/30"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-bo-neutral-950 group-hover:text-bo-primary-800">
                      {label}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-bo-neutral-500">
                      {p.state} · {p.compositeScore.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-bo-neutral-600">
                    {tighten(description, MAX_DESC)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {payload.signalOfTheDay && (
        <p className="mt-3 rounded-lg bg-bo-primary-50/60 p-3 text-xs italic text-bo-primary-900">
          {tighten(payload.signalOfTheDay, MAX_SOTD)}
        </p>
      )}
      <Link
        href="/mall/shoppermind?tab=trends"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-bo-primary-700 hover:text-bo-primary-900"
      >
        {labels.open}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </AttachmentShell>
  );
}
