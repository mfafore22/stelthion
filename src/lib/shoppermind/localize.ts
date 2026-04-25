import type {
  PhenomenonDetail,
  PhenomenonSummary,
  PhenomenonI18n,
  PhenomenonLocalizedContent,
  SignalOfTheDay,
  SignalOfTheDayI18n,
} from '@stelthion/shoppermind-client-types';
import {
  parsePhenomenonDescription,
  type ParsedPhenomenonNarrative,
} from './parse-description';

const SUPPORTED: Array<'en' | 'fi' | 'sv'> = ['en', 'fi', 'sv'];

function normaliseLang(lang: string | undefined | null): 'en' | 'fi' | 'sv' {
  if (!lang) return 'en';
  const head = lang.split('-')[0]?.toLowerCase() ?? 'en';
  return (SUPPORTED as string[]).includes(head) ? (head as 'en' | 'fi' | 'sv') : 'en';
}

function pickContent(
  i18n: PhenomenonI18n | null | undefined,
  lang: string | undefined | null,
): PhenomenonLocalizedContent | null {
  if (!i18n || typeof i18n !== 'object') return null;
  const norm = normaliseLang(lang);
  const direct = i18n[norm];
  if (direct && typeof direct === 'object') return direct;
  const fallback = i18n.en;
  return fallback && typeof fallback === 'object' ? fallback : null;
}

export interface LocalizedPhenomenon {
  label: string;
  description: string;
  parsed: ParsedPhenomenonNarrative;
}

export function localizePhenomenon(
  phen: PhenomenonSummary | PhenomenonDetail,
  lang: string | undefined | null,
): LocalizedPhenomenon {
  const content = pickContent(phen.i18n, lang);
  const label = content?.label?.trim() || phen.label;

  // Prefer structured sections when available — no parsing needed.
  if (content?.summary || content?.retailerImpact || content?.stateCommentary) {
    const description = content.description?.trim() || phen.description;
    return {
      label,
      description,
      parsed: {
        summary: content.summary?.trim() || '',
        signalCommentary: content.stateCommentary?.trim() || null,
        retailerImpact: content.retailerImpact?.trim() || null,
      },
    };
  }

  // Fallback: parse the description string (English markers only).
  const description = content?.description?.trim() || phen.description;
  return {
    label,
    description,
    parsed: parsePhenomenonDescription(description),
  };
}

export function localizeSotdNarrative(
  sotd: SignalOfTheDay,
  lang: string | undefined | null,
): string {
  const i18n = sotd.i18n as SignalOfTheDayI18n | null | undefined;
  if (!i18n || typeof i18n !== 'object') return sotd.narrative;
  const norm = normaliseLang(lang);
  const direct = i18n[norm]?.narrative;
  if (typeof direct === 'string' && direct.trim()) return direct;
  const fallback = i18n.en?.narrative;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return sotd.narrative;
}
