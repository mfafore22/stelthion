import { useTranslation } from 'react-i18next';

type Format = 'transit' | 'mixed-use' | 'destination' | 'all';

const COLORS: Record<Format, string> = {
  transit: 'bg-bo-accent/15 text-bo-accent-dark border-bo-accent/30',
  'mixed-use': 'bg-bo-primary-100 text-bo-primary-700 border-bo-primary-300',
  destination: 'bg-bo-warning-light text-bo-warning-dark border-bo-warning/30',
  all: 'bg-bo-neutral-100 text-bo-neutral-700 border-bo-neutral-300',
};

export function MallFormatBadge({ format }: { format: Format }) {
  const { t } = useTranslation('mall');
  const key = format === 'mixed-use' ? 'mixedUse' : format;
  const color = COLORS[format];
  return (
    <span className={`inline-flex items-center text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${color}`}>
      {t(`shoppermind.mallFormat.${key}`)}
    </span>
  );
}
