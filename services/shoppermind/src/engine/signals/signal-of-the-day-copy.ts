interface PhenomenonCopy {
  label: string;
  description: string;
  i18n?: unknown;
}

interface CopyInput {
  date: Date;
  marketName: string;
  phenomenon: PhenomenonCopy;
  compositeScore: number;
  scoreDate: Date;
}

export type SignalCopy = {
  narrative: string;
  i18n: Record<string, { narrative: string }>;
};

export function buildSignalOfTheDayCopy(input: CopyInput): SignalCopy {
  const date = isoDay(input.date);
  const scoreDate = isoDay(input.scoreDate);
  const score = Math.round(input.compositeScore * 100);
  const en = sentence(input, 'en', date, scoreDate, score);
  return {
    narrative: en,
    i18n: {
      en: { narrative: en },
      fi: { narrative: sentence(input, 'fi', date, scoreDate, score) },
      sv: { narrative: sentence(input, 'sv', date, scoreDate, score) },
    },
  };
}

function sentence(
  input: CopyInput,
  lang: 'en' | 'fi' | 'sv',
  date: string,
  scoreDate: string,
  score: number,
): string {
  const label = localized(input.phenomenon, lang, 'label');
  const summary = localized(input.phenomenon, lang, 'summary');
  const base = summary ? ` ${summary}` : '';
  if (lang === 'fi') {
    return `${date}: ${label} on ${input.marketName}-markkinan vahvin signaali, koontipisteet ${score} %. Tuorein pisteytys: ${scoreDate}.${base}`;
  }
  if (lang === 'sv') {
    return `${date}: ${label} är den starkaste signalen för ${input.marketName}, samlat resultat ${score} %. Senaste poängsättning: ${scoreDate}.${base}`;
  }
  return `${date}: ${label} leads ${input.marketName} signals with a ${score}% composite score. Freshest score: ${scoreDate}.${base}`;
}

function localized(
  phenomenon: PhenomenonCopy,
  lang: string,
  field: 'label' | 'summary',
): string {
  const block = i18nBlock(phenomenon.i18n, lang);
  if (field === 'label') return text(block?.label) ?? phenomenon.label;
  return text(block?.summary) ?? phenomenon.description;
}

function i18nBlock(i18n: unknown, lang: string): Record<string, unknown> | null {
  if (!i18n || typeof i18n !== 'object') return null;
  const block = (i18n as Record<string, unknown>)[lang];
  return block && typeof block === 'object' ? block as Record<string, unknown> : null;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
