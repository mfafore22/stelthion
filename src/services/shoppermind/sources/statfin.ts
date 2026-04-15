/**
 * Statistics Finland (Tilastokeskus) PxWeb / JSON-stat2 fetcher.
 *
 * The source config carries:
 *   url        — full PxWeb API endpoint, e.g.
 *                https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/klt/statfin_klt_pxt_11g7.px
 *   config.query     — JSON-stat2 query body (POST payload)
 *   config.tableLabel — short human label, e.g. "Retail turnover index"
 *   config.timeDimension — dimension code that represents time (default "Kuukausi" or "Vuosi")
 *   config.unit      — value unit, e.g. "Index (2021=100)" or "% YoY"
 *
 * For each non-time dimension combination we extract the series and emit
 * ONE RawSignal describing the most recent observation versus the prior one.
 */

import type { SourceFetcher, RawSignalInput } from '../types';

interface JsonStatDimension {
  label?: string;
  category: {
    index: Record<string, number>;
    label: Record<string, string>;
  };
}

interface JsonStatDataset {
  class?: string;
  label?: string;
  source?: string;
  updated?: string;
  id: string[];
  size: number[];
  dimension: Record<string, JsonStatDimension>;
  value: (number | null)[];
}

const TIME_DIMENSION_HINTS = ['time', 'kuukausi', 'vuosi', 'tilastokausi', 'ajankohta'];

export const fetchStatFin: SourceFetcher = async (ctx) => {
  const config = ctx.config ?? {};
  const query = (config as { query?: unknown }).query;
  const tableLabel = (config as { tableLabel?: string }).tableLabel ?? ctx.name;
  const unit = (config as { unit?: string }).unit ?? '';
  const explicitTimeDim = (config as { timeDimension?: string }).timeDimension;

  if (!query || typeof query !== 'object') {
    return { signals: [], errorMsg: 'StatFin source missing config.query' };
  }

  let res: Response;
  try {
    res = await fetch(ctx.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ShopperMind/1.0 (+stelthion.ai)',
      },
      body: JSON.stringify(query),
    });
  } catch (err) {
    return { signals: [], errorMsg: `StatFin fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!res.ok) {
    return { signals: [], errorMsg: `StatFin HTTP ${res.status}` };
  }

  let data: JsonStatDataset;
  try {
    data = (await res.json()) as JsonStatDataset;
  } catch (err) {
    return { signals: [], errorMsg: `StatFin JSON parse failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!data.id || !data.size || !data.dimension || !data.value) {
    return { signals: [], errorMsg: 'StatFin response missing JSON-stat2 fields' };
  }

  const timeDimId = explicitTimeDim ?? findTimeDimension(data);
  if (!timeDimId) {
    return { signals: [], errorMsg: 'StatFin response has no time dimension' };
  }

  const timeAxis = data.id.indexOf(timeDimId);
  if (timeAxis < 0) {
    return { signals: [], errorMsg: `Time dimension ${timeDimId} not in id list` };
  }

  const timeDim = data.dimension[timeDimId];
  const timeKeys = Object.keys(timeDim.category.index).sort(
    (a, b) => timeDim.category.index[a] - timeDim.category.index[b],
  );
  if (timeKeys.length < 2) {
    return { signals: [], errorMsg: 'StatFin series too short' };
  }

  const latestTimeKey = timeKeys[timeKeys.length - 1];
  const priorTimeKey = timeKeys[timeKeys.length - 2];
  const latestTimeLabel = timeDim.category.label[latestTimeKey] ?? latestTimeKey;
  const priorTimeLabel = timeDim.category.label[priorTimeKey] ?? priorTimeKey;
  const publishedAt = parseTimeKeyToDate(latestTimeKey);

  // Enumerate non-time dimension combinations.
  const otherDims = data.id
    .map((dimId, axis) => ({ dimId, axis, dim: data.dimension[dimId] }))
    .filter((d) => d.axis !== timeAxis);

  const combos = cartesian(otherDims.map((d) => Object.keys(d.dim.category.index)));
  const signals: RawSignalInput[] = [];

  for (const combo of combos) {
    const labelParts: string[] = [];
    const indices = new Array(data.id.length).fill(0);
    for (let i = 0; i < otherDims.length; i++) {
      const { dimId, axis, dim } = otherDims[i];
      const key = combo[i];
      indices[axis] = dim.category.index[key];
      const lbl = dim.category.label[key] ?? key;
      if (otherDims.length > 1) labelParts.push(`${dim.label ?? dimId}: ${lbl}`);
      else labelParts.push(lbl);
    }

    indices[timeAxis] = timeDim.category.index[latestTimeKey];
    const latestVal = data.value[flatIndex(indices, data.size)];
    indices[timeAxis] = timeDim.category.index[priorTimeKey];
    const priorVal = data.value[flatIndex(indices, data.size)];

    if (latestVal == null || priorVal == null) continue;

    const delta = latestVal - priorVal;
    const pct = priorVal !== 0 ? (delta / priorVal) * 100 : 0;
    const direction = delta >= 0 ? '+' : '';
    const trendWord = pct > 1 ? 'rising' : pct < -1 ? 'falling' : 'stable';

    const dimLabel = labelParts.join(' · ');
    const title = `${tableLabel}${dimLabel ? ` — ${dimLabel}` : ''}: ${latestVal.toFixed(1)}${unit ? ' ' + unit : ''} (${direction}${pct.toFixed(1)}% vs ${priorTimeLabel}) — ${trendWord}`;
    const summary = `Statistics Finland · ${latestTimeLabel}: ${latestVal.toFixed(2)}${unit ? ' ' + unit : ''}. Prior period ${priorTimeLabel}: ${priorVal.toFixed(2)}. Change ${direction}${delta.toFixed(2)} (${direction}${pct.toFixed(1)}%).`;
    const externalId = `${ctx.id}:${latestTimeKey}:${combo.join('|')}`;

    signals.push({
      externalId,
      title,
      summary,
      url: ctx.url,
      country: ctx.country,
      language: ctx.language,
      publishedAt,
      metadata: {
        source: 'StatFin',
        table: tableLabel,
        unit,
        latestPeriod: latestTimeKey,
        priorPeriod: priorTimeKey,
        latestValue: latestVal,
        priorValue: priorVal,
        deltaPct: Number(pct.toFixed(2)),
        dimensions: Object.fromEntries(
          otherDims.map((d, i) => [d.dimId, d.dim.category.label[combo[i]] ?? combo[i]]),
        ),
      },
    });
  }

  return { signals };
};

function findTimeDimension(data: JsonStatDataset): string | null {
  for (const id of data.id) {
    const lower = id.toLowerCase();
    if (TIME_DIMENSION_HINTS.some((h) => lower.includes(h))) return id;
  }
  return null;
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

function flatIndex(indices: number[], size: number[]): number {
  let flat = 0;
  for (let i = 0; i < indices.length; i++) {
    flat = flat * size[i] + indices[i];
  }
  return flat;
}

/**
 * PxWeb time keys like "2025M03", "2024K2", "2023" — convert to end-of-period Date.
 */
function parseTimeKeyToDate(key: string): Date {
  const monthMatch = key.match(/^(\d{4})M(\d{2})$/);
  if (monthMatch) {
    const y = Number(monthMatch[1]);
    const m = Number(monthMatch[2]);
    return new Date(Date.UTC(y, m, 0));
  }
  const quarterMatch = key.match(/^(\d{4})(?:K|Q)(\d)$/);
  if (quarterMatch) {
    const y = Number(quarterMatch[1]);
    const q = Number(quarterMatch[2]);
    return new Date(Date.UTC(y, q * 3, 0));
  }
  const yearMatch = key.match(/^(\d{4})$/);
  if (yearMatch) return new Date(Date.UTC(Number(yearMatch[1]), 11, 31));
  const d = new Date(key);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
