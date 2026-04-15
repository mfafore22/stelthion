/**
 * UI helpers for ShopperMind — translate raw backend strings (stub LLM fallback
 * descriptions, raw category slugs) into user-friendly localised copy.
 */

import type { TFunction } from 'i18next';

/** Pattern the stub LLM produces: "Cluster of 3 signals from FI." */
const STUB_DESCRIPTION = /^Cluster of \d+ signals? from [A-Z]{2}\.?$/;

export function friendlyDescription(
  description: string | null | undefined,
  signalsCount: number,
  categories: string[],
  t: TFunction,
): string {
  const raw = (description ?? '').trim();
  if (raw && !STUB_DESCRIPTION.test(raw)) return raw;

  const firstCategory = categories[0];
  if (firstCategory) {
    return t('shoppermind.phenomenonFallback', {
      count: signalsCount,
      category: t(`shoppermind.category.${firstCategory}`, firstCategory),
    });
  }
  return t('shoppermind.phenomenonFallbackNoCategory', { count: signalsCount });
}

export function categoryLabel(slug: string, t: TFunction): string {
  return t(`shoppermind.category.${slug}`, slug);
}

/** Best-effort detection: phenomenon looks English/non-localisable (for stub LLM output). */
export function looksEnglishOnly(label: string, description: string): boolean {
  const text = `${label} ${description}`;
  if (STUB_DESCRIPTION.test(description.trim())) return true;
  // Crude heuristic: zero Finnish-specific chars AND contains typical English function words
  const hasFinnishChars = /[äöÄÖ]/.test(text);
  if (hasFinnishChars) return false;
  return /\b(the|and|of|with|for|from|announces|will|has)\b/i.test(text);
}
