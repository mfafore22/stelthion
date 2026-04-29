import { useTranslation } from 'react-i18next';
import type { MegaPath } from '@/lib/shoppermind/megaScenario';

const TONE_CLASS: Record<string, string> = {
  neutraali: 'border-l-bo-neutral-400',
  neutral: 'border-l-bo-neutral-400',
  synkkä: 'border-l-bo-error',
  dark: 'border-l-bo-error',
  valoisa: 'border-l-bo-success',
  bright: 'border-l-bo-success',
};

export function MegaScenarioPath({ path }: { path: MegaPath }) {
  const { t } = useTranslation('mall');
  const tone = TONE_CLASS[path.tone] ?? 'border-l-bo-neutral-400';
  return (
    <article className={`border-l-4 ${tone} pl-4 py-2 mb-4`}>
      <h4 className="text-sm font-semibold text-bo-neutral-950 mb-1">{path.title}</h4>
      <p className="text-sm text-bo-neutral-700 italic mb-3 leading-relaxed">{path.summary}</p>
      <Block label={t('shoppermind.megaScenario.pathBlocks.macro')} body={path.macro} />
      <Block label={t('shoppermind.megaScenario.pathBlocks.consumer')} body={path.consumer} />
      <Block label={t('shoppermind.megaScenario.pathBlocks.retail')} body={path.retail} />
      <Block label={t('shoppermind.megaScenario.pathBlocks.property')} body={path.property} />
      <Block label={t('shoppermind.megaScenario.pathBlocks.mallImpact')} body={path.mallImpact} />
    </article>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-0.5 font-semibold">
        {label}
      </div>
      <p className="text-sm text-bo-neutral-800 leading-relaxed">{body}</p>
    </div>
  );
}
