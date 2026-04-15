import type { RawSignalInput } from './types';

const MAX_TITLE_LEN = 500;
const MAX_SUMMARY_LEN = 2000;

export function normaliseSignal(input: RawSignalInput): RawSignalInput {
  return {
    ...input,
    externalId: input.externalId.trim().slice(0, 500),
    title: collapseWhitespace(input.title).slice(0, MAX_TITLE_LEN),
    summary: input.summary
      ? collapseWhitespace(input.summary).slice(0, MAX_SUMMARY_LEN)
      : undefined,
    url: input.url?.trim(),
    country: input.country.toUpperCase(),
    language: input.language.toLowerCase(),
  };
}

export function dedupeByExternalId(signals: RawSignalInput[]): RawSignalInput[] {
  const seen = new Set<string>();
  const out: RawSignalInput[] = [];
  for (const s of signals) {
    if (seen.has(s.externalId)) continue;
    seen.add(s.externalId);
    out.push(s);
  }
  return out;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function detectLanguage(text: string, fallback: string): string {
  const sample = text.slice(0, 500).toLowerCase();
  if (/[äöå]/.test(sample) && /\b(ja|on|että|mutta|kanssa)\b/.test(sample)) return 'fi';
  if (/\b(och|att|det|inte|men)\b/.test(sample)) return 'sv';
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar';
  if (/\b(the|and|is|to|of|in)\b/.test(sample)) return 'en';
  return fallback;
}
