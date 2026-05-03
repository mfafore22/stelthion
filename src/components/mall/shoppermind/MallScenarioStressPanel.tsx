'use client';

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wrench, Activity } from 'lucide-react';
import { getMallScenarioStress, type StressImpact, type StressPath } from '@/lib/shoppermind/megaScenario';

const TONE_BORDER: Record<'a' | 'b' | 'c', string> = {
  a: 'border-bo-neutral-300', b: 'border-bo-error/60', c: 'border-bo-success/60',
};
const TONE_LABEL: Record<'a' | 'b' | 'c', string> = {
  a: 'Polku A', b: 'Polku B', c: 'Polku C',
};
const IMPACT_DOT: Record<StressImpact, string> = {
  low: 'bg-bo-success', medium: 'bg-bo-warning', high: 'bg-bo-error',
};

function PathColumn({ pathId, path }: { pathId: 'a' | 'b' | 'c'; path: StressPath }) {
  const { t } = useTranslation('mall');
  return (
    <div className={`bo-surface-subtle rounded-lg border-l-4 ${TONE_BORDER[pathId]} p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">{TONE_LABEL[pathId]}</span>
        <h5 className="text-sm font-semibold text-bo-neutral-950 leading-snug">{path.headline}</h5>
      </div>
      <Block icon={Wrench}        label={t('shoppermind.stress.operationalChanges')} items={path.operationalChanges} />
      <Block icon={AlertTriangle} label={t('shoppermind.stress.keyRisks')}             items={path.keyRisks} />
      <div className="mt-2.5">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1">
          <Activity size={11} />{t('shoppermind.stress.sensitivities')}
        </div>
        <ul className="space-y-1">
          {path.sensitivities.map((s, i) => (
            <li key={i} className="flex items-baseline gap-1.5 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPACT_DOT[s.impact]} translate-y-[3px]`} title={t(`shoppermind.stress.impact.${s.impact}`)} />
              <span className="font-medium text-bo-neutral-800">{s.label}:</span>
              <span className="text-bo-neutral-700 leading-snug">{s.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Block({ icon: Icon, label, items }: { icon: typeof Wrench; label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1">
        <Icon size={11} />{label}
      </div>
      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-bo-neutral-800 leading-snug">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  );
}

export function MallScenarioStressPanel({ mallId, lang }: { mallId: string | null; lang: string }) {
  const { t } = useTranslation('mall');
  if (!mallId) return null;
  const stress = getMallScenarioStress(mallId, lang);
  if (!stress) return null;
  return (
    <section className="mt-5">
      <h4 className="text-xs font-semibold text-bo-neutral-700 uppercase tracking-wider mb-2">
        {t('shoppermind.stress.title', { mallName: stress.mallName })}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PathColumn pathId="a" path={stress.paths.a} />
        <PathColumn pathId="b" path={stress.paths.b} />
        <PathColumn pathId="c" path={stress.paths.c} />
      </div>
    </section>
  );
}
