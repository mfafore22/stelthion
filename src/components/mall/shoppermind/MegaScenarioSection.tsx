import { useTranslation } from 'react-i18next';
import type { MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { CollapsibleSection } from './CollapsibleSection';
import { PathSummaryBand } from './PathSummaryBand';
import { PathCollapsible } from './PathCollapsible';
import { SourceLinkList } from './SourceLinkList';
import type { ScenarioPathId } from './PathReferenceText';
import { VisualBanner } from '@/components/mall/visuals/VisualBanner';
import { sectionBannerSrc } from '@/lib/shoppermind/visualTheme';

interface Props {
  scenario: MegaScenarioResolved;
  defaultOpen?: boolean;
  selectedPathId?: ScenarioPathId | null;
}

export function MegaScenarioSection({ scenario, defaultOpen = false, selectedPathId = null }: Props) {
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
        topMedia={<VisualBanner src={sectionBannerSrc('overview')} alt={title} />}
      >
        <p className="text-sm text-bo-neutral-700 leading-relaxed mb-2">{scenario.intro}</p>
        <div className="bo-surface-subtle rounded-lg border border-dashed border-bo-neutral-300 p-4 text-sm text-bo-neutral-600">
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
      topMedia={<VisualBanner src={sectionBannerSrc('overview')} alt={title} />}
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
        {scenario.paths.map((path) => (
          <PathCollapsible key={path.id} path={path} selected={path.id === selectedPathId} />
        ))}
      </div>
      <SourceLinkList sources={scenario.sources} />
    </CollapsibleSection>
  );
}
