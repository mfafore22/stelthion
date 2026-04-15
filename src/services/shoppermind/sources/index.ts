import type { SourceType } from '@prisma/client';
import type { SourceFetcher } from '../types';
import { fetchRss } from './rss';
import { fetchGoogleTrends } from './googleTrends';
import { fetchStatFin } from './statfin';
import { fetchFred } from './fred';

const NOT_IMPLEMENTED: SourceFetcher = async () => ({
  signals: [],
  errorMsg: 'fetcher not implemented yet',
});

export const FETCHERS: Record<SourceType, SourceFetcher> = {
  RSS: fetchRss,
  GOOGLE_TRENDS: fetchGoogleTrends,
  STATFIN: fetchStatFin,
  FRED: fetchFred,
  REDDIT: NOT_IMPLEMENTED,
  X: NOT_IMPLEMENTED,
  TIKTOK: NOT_IMPLEMENTED,
  TRADE_PUB: NOT_IMPLEMENTED,
};

export function getFetcher(type: SourceType): SourceFetcher {
  return FETCHERS[type] ?? NOT_IMPLEMENTED;
}
