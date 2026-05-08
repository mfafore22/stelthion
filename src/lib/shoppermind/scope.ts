import type { Scope } from '@stelthion/shoppermind-client-types';

const ALIASES: Record<string, Scope> = {
  city: 'CITY',
  local: 'CITY',
  region: 'REGION',
  regional: 'REGION',
  country: 'COUNTRY',
  national: 'COUNTRY',
  global: 'GLOBAL',
  international: 'GLOBAL',
  worldwide: 'GLOBAL',
};

export function normalizeScope(raw: string | null | undefined): Scope | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === 'CITY' || upper === 'REGION' || upper === 'COUNTRY' || upper === 'GLOBAL') {
    return upper;
  }
  return ALIASES[raw.toLowerCase()] ?? null;
}
