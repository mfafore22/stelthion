import type { SourceType } from '../../../node_modules/.prisma/shoppermind-client/index.js';
import type { SourceFetcher } from '../types.js';
import { fetchRss } from './rss.js';
import { fetchGoogleTrends } from './googleTrends.js';
import { fetchStatFin } from './statfin.js';
import { fetchFred } from './fred.js';
import { fetchFootfallCounter } from './footfall-counter.js';

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
  FOOTFALL_COUNTER: fetchFootfallCounter,
};

export function getFetcher(type: SourceType): SourceFetcher {
  return FETCHERS[type] ?? NOT_IMPLEMENTED;
}
