// Tilastokeskus PxWeb client. Public, no key required.
// Docs: https://www.stat.fi/static/media/uploads/api_screencast/px_api_v2_intro_en.pdf
//
// We use the JSON-stat 2.0 response format, which gives us the value array
// plus dimension labels we can map back to a period (year, quarter, month).

export interface StatFinPoint {
  period: string;     // canonical period label, e.g. "2026M04" or "2026Q1" or "2026"
  periodDate: Date;   // first day of the period
  value: number;
}

export interface StatFinFetchResult {
  points: StatFinPoint[];
  raw: unknown;
}

export interface StatFinQuery {
  table: string;       // e.g. "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/kbar/statfin_kbar_pxt_11hg.px"
  query: unknown;      // PxWeb query body (see StatFin docs)
  pickPeriod: (label: string) => { period: string; periodDate: Date } | null;
}

interface JsonStatResponse {
  dimension: Record<string, { category: { index: Record<string, number>; label: Record<string, string> } }>;
  id: string[];
  size: number[];
  value: Array<number | null>;
}

export async function fetchStatFin(q: StatFinQuery): Promise<StatFinFetchResult> {
  const res = await fetch(q.table, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(q.query),
  });
  if (!res.ok) {
    throw new Error(`StatFin ${res.status}: ${res.statusText}`);
  }
  const json = (await res.json()) as JsonStatResponse;
  return { points: parsePoints(json, q.pickPeriod), raw: json };
}

function parsePoints(
  json: JsonStatResponse,
  pickPeriod: StatFinQuery['pickPeriod'],
): StatFinPoint[] {
  const timeId = json.id.find((id) => /vuosi|aika|kuukausi|neljännes|year|month|quarter|time/i.test(id))
    ?? json.id[json.id.length - 1];
  const timeDim = json.dimension[timeId];
  if (!timeDim) return [];
  const labels = timeDim.category.label;
  const order = Object.entries(timeDim.category.index)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
  const out: StatFinPoint[] = [];
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    const v = json.value[i];
    if (v == null || !Number.isFinite(v)) continue;
    const label = labels[key] ?? key;
    const parsed = pickPeriod(label);
    if (!parsed) continue;
    out.push({ period: parsed.period, periodDate: parsed.periodDate, value: v });
  }
  return out;
}

// Period parsers used by the indicator catalog. Each returns a canonical
// period string ("2026M04" / "2026Q1" / "2026") and a Date for sorting.

export function parseMonth(label: string): { period: string; periodDate: Date } | null {
  // Accepts "2026M04", "2026M4", "04/2026", "2026 04", "Huhtikuu 2026"
  const m = label.match(/(\d{4})\D{0,2}(\d{1,2})/) ?? label.match(/(\d{1,2})\D{0,2}(\d{4})/);
  if (!m) return null;
  const year = m[1].length === 4 ? +m[1] : +m[2];
  const month = m[1].length === 4 ? +m[2] : +m[1];
  if (month < 1 || month > 12) return null;
  return { period: `${year}M${String(month).padStart(2, '0')}`, periodDate: new Date(Date.UTC(year, month - 1, 1)) };
}

export function parseQuarter(label: string): { period: string; periodDate: Date } | null {
  const m = label.match(/(\d{4}).{0,2}Q?([1-4])/i) ?? label.match(/Q?([1-4]).{0,2}(\d{4})/i);
  if (!m) return null;
  const year = m[1].length === 4 ? +m[1] : +m[2];
  const q = m[1].length === 4 ? +m[2] : +m[1];
  return { period: `${year}Q${q}`, periodDate: new Date(Date.UTC(year, (q - 1) * 3, 1)) };
}
