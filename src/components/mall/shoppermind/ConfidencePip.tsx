import { useTranslation } from 'react-i18next';

export function ConfidencePip({ score }: { score: number }) {
  const { t } = useTranslation('mall');
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 90 ? 'bg-bo-success' : pct >= 75 ? 'bg-bo-primary-500' : pct >= 60 ? 'bg-bo-warning' : 'bg-bo-error';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium text-bo-neutral-700"
      title={t('shoppermind.curatedTrends.confidenceTooltip', { defaultValue: 'Lähteiden ja yhdenmukaisuuden luotettavuusarvio' })}
    >
      <span className="relative w-7 h-1.5 rounded-full bg-bo-neutral-200 overflow-hidden">
        <span className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">{pct}/100</span>
    </span>
  );
}
