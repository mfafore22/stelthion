'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatBubbleIcon } from '@/components/concierge/ChatBubbleButton';
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
        <div>
          <CuratedCampaignDetails campaign={campaigns[openIndex]} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/mall/campaigns"
              className="inline-flex items-center gap-1.5 rounded-lg bg-bo-primary-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-bo-primary-800"
            >
              <Megaphone size={13} />
              {t('shoppermind.curatedTrends.draftCampaign')}
            </Link>
            <Link
              href="/mall/assistants"
              className="inline-flex items-center gap-2 rounded-full border border-bo-neutral-200 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-bo-neutral-800 shadow-bo-sm backdrop-blur-md hover:border-bo-primary-200 hover:bg-white"
            >
              <ChatBubbleIcon />
              {t('shoppermind.curatedTrends.discussCampaign')}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
