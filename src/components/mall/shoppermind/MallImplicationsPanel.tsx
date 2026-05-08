import { useTranslation } from 'react-i18next';

interface Props {
  implications: string[];
  opportunitiesFallback?: string[];
  mallName?: string;
}

export function MallImplicationsPanel({ implications, opportunitiesFallback, mallName }: Props) {
  const { t } = useTranslation('mall');
  const useFallback = (!implications || implications.length === 0) && opportunitiesFallback && opportunitiesFallback.length > 0;
  const list = useFallback ? opportunitiesFallback! : (implications ?? []);
  if (list.length === 0) return null;
  const label = useFallback
    ? t('shoppermind.curatedTrends.opportunities')
    : (mallName
        ? t('shoppermind.curatedTrends.mallImplicationsFor', { mallName })
        : t('shoppermind.curatedTrends.mallImplications'));
  return (
    <section className="mt-3">
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1.5">
        {label}
      </div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-bo-neutral-800 leading-relaxed">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
