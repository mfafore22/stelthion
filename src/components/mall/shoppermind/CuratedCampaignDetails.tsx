import { Megaphone, Users, Calendar, Radio, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CuratedCampaign } from '@/lib/shoppermind/megaScenario';

function ChannelChip({ code }: { code: string }) {
  const { t } = useTranslation('mall');
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-bo-neutral-100 border border-bo-neutral-300 text-bo-neutral-700">
      <Radio size={9} />
      {t(`shoppermind.channels.${code}`, { defaultValue: code })}
    </span>
  );
}

function Field({ icon: Icon, label, body }: { icon: typeof Users; label: string; body: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={11} className="text-bo-neutral-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 leading-tight">
          {label}
        </div>
        <div className="text-[12px] text-bo-neutral-800 leading-snug">{body}</div>
      </div>
    </div>
  );
}

export function CuratedCampaignDetails({ campaign }: { campaign: CuratedCampaign }) {
  const { t } = useTranslation('mall');
  return (
    <div className="rounded-lg border border-bo-primary-200 bg-bo-primary-50/40 p-3 mt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Megaphone size={14} className="text-bo-primary-700" />
        <strong className="text-sm text-bo-neutral-950">{campaign.name}</strong>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {campaign.audience && (
          <Field icon={Users} label={t('shoppermind.curatedTrends.audience')} body={campaign.audience} />
        )}
        {campaign.whyNow && (
          <Field icon={Calendar} label={t('shoppermind.curatedTrends.whyNow')} body={campaign.whyNow} />
        )}
        {campaign.successMetric && (
          <Field icon={Target} label={t('shoppermind.curatedTrends.successMetric')} body={campaign.successMetric} />
        )}
        {campaign.channels && campaign.channels.length > 0 && (
          <div className="flex items-start gap-2">
            <Radio size={11} className="text-bo-neutral-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 leading-tight mb-1">
                {t('shoppermind.curatedTrends.channels')}
              </div>
              <div className="flex flex-wrap gap-1">
                {campaign.channels.map((c) => <ChannelChip key={c} code={c} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
