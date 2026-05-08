import type { FetchResult, SourceFetcher, RawSignalInput } from '../types.js';
import { normaliseSignal } from '../normaliser.js';

interface TrendsConfig {
  geo?: string;
  queries?: string[];
}

const RATE_LIMIT_MS = Number(process.env.GOOGLE_TRENDS_RATE_LIMIT_MS ?? 2000);

export const fetchGoogleTrends: SourceFetcher = async (ctx): Promise<FetchResult> => {
  const cfg = (ctx.config as TrendsConfig | null) ?? {};
  const geo = cfg.geo ?? ctx.country;
  const queries = cfg.queries ?? [];

  if (queries.length === 0) {
    return { signals: [], errorMsg: 'no queries configured' };
  }

  type TrendsApiLike = { interestOverTime: (opts: Record<string, unknown>) => Promise<string> };
  let trendsApi: TrendsApiLike | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = await (Function('return import("google-trends-api")')() as Promise<Record<string, unknown>>).catch(() => null);
    if (mod) {
      trendsApi = (mod.default ?? mod) as TrendsApiLike;
    }
  } catch {
    trendsApi = null;
  }

  if (!trendsApi) {
    return { signals: [], errorMsg: 'google-trends-api package not installed' };
  }

  const signals: RawSignalInput[] = [];
  const now = new Date();
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const query of queries) {
    try {
      const raw = await trendsApi.interestOverTime({ keyword: query, geo, startTime });
      const parsed = JSON.parse(raw);
      const timeline = parsed?.default?.timelineData ?? [];
      if (timeline.length === 0) continue;

      const values = timeline.map((t: { value: number[] }) => t.value?.[0] ?? 0);
      const latest = values[values.length - 1];
      const prev = values.slice(-8, -1);
      const avg = prev.length ? prev.reduce((a: number, b: number) => a + b, 0) / prev.length : 0;
      const momentum = latest - avg;

      signals.push(
        normaliseSignal({
          externalId: `trends:${geo}:${query}:${now.toISOString().slice(0, 10)}`,
          title: `Search interest: "${query}" (${geo})`,
          summary: `Latest interest ${latest} vs. 7d avg ${avg.toFixed(1)} (Δ ${momentum.toFixed(1)}).`,
          country: ctx.country,
          language: ctx.language,
          publishedAt: now,
          metadata: { query, geo, latest, avg, momentum, timeline: values },
        }),
      );
      await sleep(RATE_LIMIT_MS);
    } catch (err) {
      signals.push(
        normaliseSignal({
          externalId: `trends:${geo}:${query}:${now.toISOString().slice(0, 10)}:err`,
          title: `Google Trends error for "${query}"`,
          summary: err instanceof Error ? err.message : String(err),
          country: ctx.country,
          language: ctx.language,
          publishedAt: now,
          metadata: { query, geo, error: true },
        }),
      );
    }
  }

  return { signals };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
