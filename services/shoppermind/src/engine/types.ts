import type { SourceType } from '../../node_modules/.prisma/shoppermind-client/index.js';

export interface RawSignalInput {
  externalId: string;
  title: string;
  summary?: string;
  url?: string;
  country: string;
  language: string;
  publishedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FetchResult {
  signals: RawSignalInput[];
  errorMsg?: string;
}

export interface SourceFetcherContext {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  country: string;
  language: string;
  config: Record<string, unknown> | null;
}

export type SourceFetcher = (ctx: SourceFetcherContext) => Promise<FetchResult>;
