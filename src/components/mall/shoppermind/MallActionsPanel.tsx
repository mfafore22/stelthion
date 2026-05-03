import { useTranslation } from 'react-i18next';
import type { MallActions } from '@/lib/shoppermind/megaScenario';
import { PropertySelector } from './PropertySelector';

interface Props {
  options: Array<{ id: string; name: string; operator?: string; isCompetitor?: boolean }>;
  selectedMallId: string | null;
  onSelectMall: (id: string) => void;
  perMall: MallActions | null;
}

export function MallActionsPanel({ options, selectedMallId, onSelectMall, perMall }: Props) {
  const { t } = useTranslation('mall');
  return (
    <div className="space-y-3">
      <PropertySelector options={options} value={selectedMallId} onChange={onSelectMall} />
      {perMall ? (
        <div className={`bo-surface-subtle rounded-xl border p-4 ${perMall.isCompetitor ? 'border-bo-warning/30' : 'border-bo-neutral-200/60'}`}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-bo-neutral-950">{perMall.name}</h4>
            {perMall.operator && (
              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${perMall.isCompetitor ? 'bg-bo-warning/20 text-bo-warning-dark' : 'bg-bo-primary-100 text-bo-primary-700'}`}>
                {perMall.isCompetitor ? `${t('shoppermind.actions.competitorTag')}: ${perMall.operator}` : perMall.operator}
              </span>
            )}
          </div>
          <p className="text-xs text-bo-neutral-600 mb-3 leading-relaxed">{perMall.context}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-bo-neutral-800 leading-relaxed">
            {perMall.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-bo-neutral-500 italic">{t('shoppermind.actions.noMallSelected')}</p>
      )}
    </div>
  );
}
