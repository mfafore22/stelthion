const PREFIX = 'shoppermind:cache';

export function marketOverviewCacheKey(marketId: string): string {
  return `${PREFIX}:${marketId}:overview`;
}

export function phenomenonDetailCacheKey(marketId: string, phenomenonId: string): string {
  return `${PREFIX}:${marketId}:phenomenon:${phenomenonId}`;
}

export function retrievalCorpusCacheKey(marketId: string, windowDays: number): string {
  return `${PREFIX}:${marketId}:retrieval:${windowDays}`;
}

export function marketCachePattern(marketId: string): string {
  return `${PREFIX}:${marketId}:*`;
}
