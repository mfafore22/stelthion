import { useTranslation } from 'react-i18next';
import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { CollapsibleSection } from './CollapsibleSection';
import { MegaScenarioPath } from './MegaScenarioPath';
import { MegaScenarioActions } from './MegaScenarioActions';
import { SourceLinkList } from './SourceLinkList';

export function MegaScenarioSection({ scenario }: { scenario: MegaScenarioResolved }) {
  const { t } = useTranslation('mall');
  return (
    <CollapsibleSection
      title={`${t('shoppermind.megaScenario.label')}: ${scenario.title}`}
      timespan={scenario.timespan}
      defaultOpen
      toneClassName="ring-1 ring-bo-primary-200/60"
    >
      <p className="text-sm text-bo-neutral-800 leading-relaxed mb-3">{scenario.intro}</p>
      <p className="text-sm text-bo-neutral-700 leading-relaxed italic border-l-2 border-bo-primary-300 pl-3 mb-5">
        {scenario.redString}
      </p>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-bo-neutral-950 mb-3">{scenario.pathsLabel}</h3>
        {scenario.paths.map((path) => (
          <MegaScenarioPath key={path.id} path={path} />
        ))}
      </div>

      <MegaScenarioActions scenario={scenario} />
      <SourceLinkList sources={scenario.sources} />
    </CollapsibleSection>
  );
}
