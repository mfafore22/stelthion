/**
 * FRED (Federal Reserve Economic Data) CSV fetcher.
 *
 * FRED exposes every series as a 2-column CSV (date,value) at
 *   https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES_ID>
 * No auth required for public series. We extract the latest observation and
 * emit a single signal describing latest vs. prior period.
 *
 * Source config:
 *   url        — full fredgraph.csv URL (or any CSV URL matching the 2-col shape)
 *   config.seriesId   — FRED series id, used in externalId + metadata
 *   config.tableLabel — human label, e.g. "Finland residential property price index (BIS)"
 *   config.unit       — value unit, e.g. "index (2010=100)"
 */

import type { SourceFetcher, RawSignalInput } from '../types';

export const fetchFred: SourceFetcher = async (ctx) => {
  const config = (ctx.config ?? {}) as {
    seriesId?: string;
    tableLabel?: string;
    unit?: string;
  };
  const seriesId = config.seriesId ?? extractSeriesIdFromUrl(ctx.url) ?? ctx.name;
  const tableLabel = config.tableLabel ?? ctx.name;
  const unit = config.unit ?? '';

  let res: Response;
  try {
    res = await fetch(ctx.url, {
      headers: {
        'User-Agent': 'ShopperMind/1.0 (+stelthion.ai)',
        Accept: 'text/csv,text/plain',
      },
    });
  } catch (err) {
    return { signals: [], errorMsg: `FRED fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!res.ok) return { signals: [], errorMsg: `FRED HTTP ${res.status}` };

  const csv = await res.text();
  const rows = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('DATE') && !l.startsWith('observation_date'));

  const parsed: Array<{ date: string; value: number }> = [];
  for (const row of rows) {
    const [date, raw] = row.split(',');
    if (!date || !raw || raw === '.') continue;
    const v = Number(raw);
    if (Number.isFinite(v)) parsed.push({ date, value: v });
  }
  if (parsed.length < 2) {
    return { signals: [], errorMsg: 'FRED series has fewer than 2 observations' };
  }

  const latest = parsed[parsed.length - 1];
  const prior = parsed[parsed.length - 2];
  const delta = latest.value - prior.value;
  const pct = prior.value !== 0 ? (delta / prior.value) * 100 : 0;
  const direction = delta >= 0 ? '+' : '';
  const trendWord = pct > 1 ? 'rising' : pct < -1 ? 'falling' : 'stable';

  const signal: RawSignalInput = {
    externalId: `${seriesId}:${latest.date}`,
    title: `${tableLabel}: ${latest.value.toFixed(2)}${unit ? ' ' + unit : ''} (${direction}${pct.toFixed(1)}% vs ${prior.date}) — ${trendWord}`,
    summary: `FRED ${seriesId} · ${latest.date}: ${latest.value.toFixed(2)}${unit ? ' ' + unit : ''}. Prior ${prior.date}: ${prior.value.toFixed(2)}. Change ${direction}${delta.toFixed(2)} (${direction}${pct.toFixed(1)}%).`,
    url: ctx.url,
    country: ctx.country,
    language: ctx.language,
    publishedAt: new Date(`${latest.date}T00:00:00Z`),
    metadata: {
      source: 'FRED',
      seriesId,
      unit,
      latestPeriod: latest.date,
      priorPeriod: prior.date,
      latestValue: latest.value,
      priorValue: prior.value,
      deltaPct: Number(pct.toFixed(2)),
    },
  };

  return { signals: [signal] };
};

function extractSeriesIdFromUrl(url: string): string | null {
  const m = url.match(/[?&]id=([^&]+)/);
  return m ? m[1] : null;
}
