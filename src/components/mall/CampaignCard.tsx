/**
 * Campaign Card Component
 * Campaign attribution with ML confidence - competitive differentiator
 */

'use client';

import React from 'react';
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface CampaignCardProps {
  mallId: string;
  expanded?: boolean;
}

export function CampaignCard({ mallId, expanded = false }: CampaignCardProps) {
  const { t } = useTranslation('mall');

  // Mock campaign data
  const campaign = {
    name: 'Syyskampanja 2025',
    dateRange: '10.10.–20.10.2025',
    visitorUplift: 8.2,
    revenueImpact: 120000,
    confidence: 82,
    channels: ['Sosiaalinen media', 'Sähköposti', 'Digitaalinäytöt'],
  };

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-bo-accent-600" />
        <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('campaigns.latestCampaign')}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="font-semibold text-bo-neutral-950">{campaign.name}</div>
          <div className="flex items-center gap-2 text-sm text-bo-neutral-600">
            <Calendar className="h-4 w-4" />
            <span>{campaign.dateRange}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-bo-success-light/70 p-3 border border-bo-success/15">
            <div className="text-sm text-bo-neutral-600">{t('campaigns.visitorImpact')}</div>
            <div className="text-xl font-bold text-bo-success-dark">+{campaign.visitorUplift}%</div>
          </div>
          <div className="rounded-lg bg-bo-info-light/70 p-3 border border-bo-info/15">
            <div className="text-sm text-bo-neutral-600">{t('campaigns.revenueImpact')}</div>
            <div className="text-xl font-bold text-bo-info-dark">
              €{(campaign.revenueImpact / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-bo-accent-300 bg-bo-accent-100/50 p-3">
          <div className="text-sm text-bo-neutral-600">{t('campaigns.mlConfidence')}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-bo-accent-200">
              <div
                className="h-2 rounded-full bg-bo-accent-600"
                style={{ width: `${campaign.confidence}%` }}
              />
            </div>
            <span className="font-semibold text-bo-accent-700">{campaign.confidence}%</span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-bo-neutral-600">{t('campaigns.channels')}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {campaign.channels.map((channel) => (
              <span
                key={channel}
                className="rounded-full bg-bo-primary-100 px-3 py-1 text-xs font-medium text-bo-primary-700 border border-bo-primary-200"
              >
                {channel}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-bo-neutral-700 border-bo-neutral-300 hover:bg-bo-neutral-100">
            {t('campaigns.viewCampaignLog')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-bo-neutral-700 border-bo-neutral-300 hover:bg-bo-neutral-100" asChild>
            <Link href={`/mall/${mallId}/scenario?preset=campaign`}>{t('campaigns.runSimilarScenario')}</Link>
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4 border-t border-bo-neutral-200/50 pt-4">
          <h4 className="font-semibold text-bo-neutral-950">{t('campaigns.campaignHistory')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">Kesäale 2025</span>
              <span className="text-bo-success-dark font-medium">+12.4% {t('campaigns.visitors')}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">Kevätmuotiviikko</span>
              <span className="text-bo-success-dark font-medium">+9.8% {t('campaigns.visitors')}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">Ystävänpäivä 2025</span>
              <span className="text-bo-success-dark font-medium">+6.2% {t('campaigns.visitors')}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
