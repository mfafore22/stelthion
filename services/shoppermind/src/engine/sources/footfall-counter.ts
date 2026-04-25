import type { FetchResult, SourceFetcher, RawSignalInput } from '../types.js';

interface FootfallRow {
  zoneId: string;
  zoneName?: string;
  floor: number;
  date: string;
  hour: number;
  visitors: number;
}

interface FootfallExportResponse {
  mallId: string;
  from: string;
  to: string;
  readings: FootfallRow[];
}

// Converts hourly visitor counts from a Stelthion mall into RawSignals.
// The source url is the Stelthion export endpoint:
//   https://<host>/api/internal/footfall-export?mallId=<id>&from=<date>&to=<date>
// The bearer token is stored in ctx.config.apiKey.
export const fetchFootfallCounter: SourceFetcher = async (ctx): Promise<FetchResult> => {
  const apiKey = (ctx.config?.apiKey as string | undefined) ?? '';
  if (!apiKey) {
    return { signals: [], errorMsg: 'footfall_counter: apiKey not configured in source config' };
  }

  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400000);
  const url = new URL(ctx.url);
  url.searchParams.set('from', from.toISOString().split('T')[0]);
  url.searchParams.set('to', to.toISOString().split('T')[0]);

  let data: FootfallExportResponse;
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { signals: [], errorMsg: `footfall HTTP ${res.status}` };
    data = await res.json() as FootfallExportResponse;
  } catch (e) {
    return { signals: [], errorMsg: `footfall fetch failed: ${String(e)}` };
  }

  const signals: RawSignalInput[] = data.readings.map((r) => ({
    externalId: `footfall:${data.mallId}:${r.zoneId}:${r.date}:${r.hour}`,
    title: `Footfall spike — ${r.zoneName ?? r.zoneId} at ${r.hour}:00`,
    summary: `${r.visitors} visitors recorded in zone ${r.zoneName ?? r.zoneId} on ${r.date} at ${r.hour}:00.`,
    url: ctx.url,
    country: ctx.country,
    language: ctx.language,
    publishedAt: new Date(`${r.date}T${String(r.hour).padStart(2, '0')}:00:00Z`),
    metadata: { mallId: data.mallId, zoneId: r.zoneId, floor: r.floor, visitors: r.visitors },
  }));

  return { signals };
};
