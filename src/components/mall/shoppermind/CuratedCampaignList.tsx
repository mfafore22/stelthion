'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CuratedCampaign } from '@/lib/shoppermind/megaScenario';
import { CuratedCampaignDetails } from './CuratedCampaignDetails';

export function CuratedCampaignList({ campaigns }: { campaigns: CuratedCampaign[] }) {
  const { t } = useTranslation('mall');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!campaigns || campaigns.length === 0) return null;
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1.5">
        {t('shoppermind.curatedTrends.campaigns')}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {campaigns.map((c, i) => {
          const isOpen = openIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                isOpen
                  ? 'bg-bo-primary-700 text-white border-bo-primary-700'
                  : 'bg-bo-primary-50 border-bo-primary-200 text-bo-primary-800 hover:bg-bo-primary-100'
              }`}
            >
              {c.name}
              <ChevronRight size={10} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          );
        })}
      </div>
      {openIndex !== null && campaigns[openIndex] && (
        <CuratedCampaignDetails campaign={campaigns[openIndex]} />
      )}
    </section>
  );
}
