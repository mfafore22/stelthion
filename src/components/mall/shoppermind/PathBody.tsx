import { useTranslation } from 'react-i18next';
import type { MegaPath } from '@/lib/shoppermind/megaScenario';
import { SectionHeading, type SectionKind } from './SectionHeading';
import { EvidenceGraphRow } from './EvidenceGraphRow';
import { KeyNumbersGrid } from './KeyNumbersGrid';

const SECTIONS: Array<{ kind: SectionKind; field: keyof MegaPath; tKey: string }> = [
  { kind: 'macro',      field: 'macro',      tKey: 'shoppermind.megaScenario.pathBlocks.macro' },
  { kind: 'consumer',   field: 'consumer',   tKey: 'shoppermind.megaScenario.pathBlocks.consumer' },
  { kind: 'retail',     field: 'retail',     tKey: 'shoppermind.megaScenario.pathBlocks.retail' },
  { kind: 'property',   field: 'property',   tKey: 'shoppermind.megaScenario.pathBlocks.property' },
  { kind: 'mallImpact', field: 'mallImpact', tKey: 'shoppermind.megaScenario.pathBlocks.mallImpact' },
];

export function PathBody({ path }: { path: MegaPath }) {
  const { t } = useTranslation('mall');
  return (
    <div>
      <p className="text-sm text-bo-neutral-700 italic leading-relaxed mb-3">{path.summary}</p>
      {SECTIONS.map(({ kind, field, tKey }) => (
        <div key={kind}>
          <SectionHeading kind={kind} label={t(tKey)} />
          <p className="text-sm text-bo-neutral-800 leading-relaxed">{path[field] as string}</p>
        </div>
      ))}
      {path.evidenceCharts && path.evidenceCharts.length > 0 && (
        <EvidenceGraphRow charts={path.evidenceCharts} label={t('shoppermind.megaScenario.evidenceLabel')} />
      )}
      {path.keyNumbers && path.keyNumbers.length > 0 && (
        <KeyNumbersGrid numbers={path.keyNumbers} label={t('shoppermind.megaScenario.keyNumbersLabel')} />
      )}
    </div>
  );
}
