import { useTranslation } from 'react-i18next';
import type { SignalOfTheDay } from '@stelthion/shoppermind-client-types';
import { SourceLogos } from './SourceLogos';
import { CollapsibleSection } from './CollapsibleSection';
import { localizeSotdNarrative, localizeSotdSections } from '@/lib/shoppermind/localize';

export function SignalOfTheDayCard({
  sotd,
  defaultOpen = false,
}: {
  sotd: SignalOfTheDay | null;
  defaultOpen?: boolean;
}) {
  const { t, i18n } = useTranslation('mall');
  if (!sotd) {
    return (
      <CollapsibleSection
        title={t('shoppermind.signalSections.monthly')}
        defaultOpen={defaultOpen}
        toneClassName="ring-1 ring-bo-neutral-200/60"
      >
        <div className="text-sm text-bo-neutral-500">
          {t('shoppermind.signalOfTheDay.comingSoon', {
            defaultValue: t('shoppermind.signalOfTheDay.empty'),
          })}
        </div>
      </CollapsibleSection>
    );
  }
  const sections = localizeSotdSections(sotd, i18n.language);
  const narrative = localizeSotdNarrative(sotd, i18n.language);
  const monthLabel = (() => {
    try {
      const d = new Date(sotd.date);
      const formatted = new Intl.DateTimeFormat(i18n.language, {
        month: 'long', year: 'numeric',
      }).format(d);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return sotd.date.slice(0, 10);
    }
  })();
  return (
    <CollapsibleSection
      title={t('shoppermind.signalSections.monthly')}
      timespan={monthLabel}
      defaultOpen={defaultOpen}
      toneClassName="ring-1 ring-bo-neutral-200/60"
    >
      {sections ? <SignalSections sections={sections} /> : (
        <p className="text-sm text-bo-neutral-800 leading-relaxed whitespace-pre-wrap">{narrative}</p>
      )}
      <div className="mt-5 pt-3 border-t border-bo-neutral-200/60">
        <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 mb-1.5 font-medium">
          {t('shoppermind.sources.label', 'Sources')}
        </div>
        <SourceLogos contributingSources={sotd.contributingSources} />
      </div>
    </CollapsibleSection>
  );
}

function SignalSections({ sections }: { sections: NonNullable<ReturnType<typeof localizeSotdSections>> }) {
  const { t } = useTranslation('mall');
  return (
    <div className="space-y-5">
      {sections.headline && (
        <h3 className="text-base font-semibold text-bo-neutral-950 leading-snug tracking-tight">{sections.headline}</h3>
      )}
      {sections.keyFindings && sections.keyFindings.length > 0 && (
        <Bullets label={t('shoppermind.signalSections.keyFindings')} items={sections.keyFindings} />
      )}
      {sections.byCity && sections.byCity.length > 0 && (
        <div className="space-y-3">
          {sections.byCity.map((b, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-1.5 font-semibold">
                {t('shoppermind.signalSections.byCity', { city: b.city })}
              </div>
              <p className="text-sm text-bo-neutral-800 leading-relaxed whitespace-pre-wrap">{b.body}</p>
            </div>
          ))}
        </div>
      )}
      {sections.alsoVisible && sections.alsoVisible.length > 0 && (
        <Bullets label={t('shoppermind.signalSections.alsoVisible')} items={sections.alsoVisible} />
      )}
      {sections.watching && sections.watching.length > 0 && (
        <Bullets label={t('shoppermind.signalSections.watching')} items={sections.watching} />
      )}
    </div>
  );
}

function Bullets({ label, items }: { label: string; items: string[] }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-1.5 font-semibold">{label}</div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-bo-neutral-800 leading-relaxed">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  );
}
