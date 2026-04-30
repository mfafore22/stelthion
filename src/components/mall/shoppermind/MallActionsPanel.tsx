import { useTranslation } from 'react-i18next';
import type { MallActions } from '@/lib/shoppermind/megaScenario';
import { PropertySelector } from './PropertySelector';

interface Props {
  options: Array<{ id: string; name: string }>;
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
        <div className="rounded-xl bg-bo-neutral-50/60 border border-bo-neutral-200/60 p-4">
          <h4 className="text-sm font-semibold text-bo-neutral-950 mb-1">{perMall.name}</h4>
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
