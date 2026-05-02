import { useTranslation } from 'react-i18next';
import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { CollapsibleSection } from './CollapsibleSection';
import { PathSummaryBand } from './PathSummaryBand';
import { PathCollapsible } from './PathCollapsible';
import { SourceLinkList } from './SourceLinkList';

interface Props {
  scenario: MegaScenarioResolved;
  defaultOpen?: boolean;
}

export function MegaScenarioSection({ scenario, defaultOpen = false }: Props) {
  const { t } = useTranslation('mall');
  const title = scenario.country === 'FI'
    ? t('shoppermind.megaScenario.finlandStructuralTitle')
    : `${t('shoppermind.megaScenario.label')}: ${scenario.title}`;
  if (scenario.placeholder) {
    return (
      <CollapsibleSection
        title={title}
        timespan={scenario.timespan}
        toneClassName="ring-1 ring-bo-neutral-200/60"
        defaultOpen={defaultOpen}
      >
        <p className="text-sm text-bo-neutral-700 leading-relaxed mb-2">{scenario.intro}</p>
        <div className="rounded-lg border border-dashed border-bo-neutral-300 bg-bo-neutral-50/50 p-4 text-sm text-bo-neutral-600">
          {t('shoppermind.markets.comingSoonBody', { defaultValue: 'Markkinaa kerätään parhaillaan.' })}
        </div>
      </CollapsibleSection>
    );
  }
  return (
    <CollapsibleSection
      title={title}
      timespan={scenario.timespan}
      toneClassName="ring-1 ring-bo-primary-200/60"
      defaultOpen={defaultOpen}
    >
      <p className="text-sm text-bo-neutral-800 leading-relaxed mb-2">{scenario.intro}</p>
      <p className="text-sm text-bo-neutral-700 leading-relaxed italic border-l-2 border-bo-primary-300 pl-3 mb-4">
        {scenario.redString}
      </p>
      <PathSummaryBand paths={scenario.paths} />
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-bo-neutral-700 uppercase tracking-wider mb-2">
          {scenario.pathsLabel}
        </h3>
        {scenario.paths.map((path) => <PathCollapsible key={path.id} path={path} />)}
      </div>
      <SourceLinkList sources={scenario.sources} />
    </CollapsibleSection>
  );
}
