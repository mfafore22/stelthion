import type { MarketProfile } from './markets';

function normaliseText(text: string): string {
  return text.toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(text: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const pattern = new RegExp(`(^|[^\\p{L}])${escapeRegex(kw.toLowerCase())}`, 'u');
    if (pattern.test(text)) hits++;
  }
  return hits;
}

/**
 * Relevance = has at least one matching category keyword.
 * This keeps the retail/property topic filter tightly coupled to the taxonomy
 * and avoids broad geographic or generic-industry false positives.
 */
export function scoreRelevance(text: string, profile: MarketProfile): number {
  const lower = normaliseText(text);
  let total = 0;
  for (const keywords of Object.values(profile.categoryKeywords)) {
    total += countMatches(lower, keywords);
  }
  return total;
}

export function isRelevant(text: string, profile: MarketProfile): boolean {
  return scoreRelevance(text, profile) > 0;
}

/** Infer categories from text by keyword voting. Returns top N (default 3). */
export function inferCategories(
  text: string,
  profile: MarketProfile,
  max = 3,
): string[] {
  const lower = normaliseText(text);
  const scored: Array<{ category: string; hits: number }> = [];
  for (const [category, keywords] of Object.entries(profile.categoryKeywords)) {
    const hits = countMatches(lower, keywords);
    if (hits > 0) scored.push({ category, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, max).map((s) => s.category);
}
