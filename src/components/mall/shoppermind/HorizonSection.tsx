import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';
import type { Horizon } from '@/lib/shoppermind/horizon';
import { CollapsibleSection } from './CollapsibleSection';
import { PhenomenonCard } from './PhenomenonCard';

interface Props {
  horizon: Horizon;
  phenomena: PhenomenonSummary[];
  mallId: string | null | undefined;
  defaultOpen?: boolean;
  topSlot?: ReactNode;
  curatedCount?: number;
}

export function HorizonSection({ horizon, phenomena, mallId, defaultOpen = false, topSlot, curatedCount = 0 }: Props) {
  const { t } = useTranslation('mall');
  const label = t(`shoppermind.horizons.${horizon}.label`);
  const timespan = t(`shoppermind.horizons.${horizon}.timespan`);
  const verb = t(`shoppermind.horizons.${horizon}.verb`);
  const subtitle = `${verb}: ${t(`shoppermind.horizons.${horizon}.subtitle`)}`;
  const emptyKey = horizon === 'short' ? 'emptyShort' : horizon === 'medium' ? 'emptyMedium' : 'emptyLong';
  const trackedCount = phenomena.length + curatedCount;
  return (
    <CollapsibleSection
      title={label}
      timespan={timespan}
      subtitle={subtitle}
      defaultOpen={defaultOpen}
      rightSlot={
        <span className="text-xs text-bo-neutral-500 tabular-nums">
          {t('shoppermind.horizons.tracked', { count: trackedCount })}
        </span>
      }
    >
      {topSlot}
      {phenomena.length === 0 && curatedCount === 0 ? (
        <div className="text-sm text-bo-neutral-500">
          {t(`shoppermind.horizons.${emptyKey}`)}
        </div>
      ) : phenomena.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {phenomena.map((p) => (
            <PhenomenonCard key={p.id} phenomenon={p} mallId={mallId} />
          ))}
        </div>
      ) : null}
    </CollapsibleSection>
  );
}
