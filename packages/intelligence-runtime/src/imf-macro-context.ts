// IMF DataMapper API adapter for the MacroContextPort.
// API shape: https://www.imf.org/external/datamapper/api/v1/{series}/{area}
// Response: { values: { [series]: { [area]: { [year]: number } } } }
// Annual cadence. Years are strings; values are numbers.

import { textKey } from './localized-text.js';
import {
  MissingMacroIndicatorError,
  type MacroContextPort,
  type MacroIndicatorDescriptor,
  type MacroIndicatorPoint,
  type MacroIndicatorSeries,
} from './macro-context-port.js';

export const IMF_API_BASE = 'https://www.imf.org/external/datamapper/api/v1';

export const IMF_INDICATORS: MacroIndicatorDescriptor[] = [
  descriptor('imf-world-gdp-growth', 'NGDP_RPCH', 'WLD', 'percent', 'macro.imf.worldGdpGrowth'),
  descriptor('imf-world-inflation', 'PCPIPCH', 'WLD', 'percent', 'macro.imf.worldInflation'),
  descriptor('imf-advanced-inflation', 'PCPIPCH', 'ADVEC', 'percent', 'macro.imf.advancedInflation'),
  descriptor('imf-emerging-gdp-growth', 'NGDP_RPCH', 'EMDE', 'percent', 'macro.imf.emergingGdpGrowth'),
  descriptor('imf-world-debt-gdp', 'GGXWDG_NGDP', 'WLD', 'percent-of-gdp', 'macro.imf.worldDebtGdp'),
];

export interface ImfFetcher {
  (url: string): Promise<unknown>;
}

export class ImfMacroContextAdapter implements MacroContextPort {
  constructor(
    private fetcher: ImfFetcher = defaultFetcher,
    private now: () => Date = () => new Date(),
    private indicators: MacroIndicatorDescriptor[] = IMF_INDICATORS,
  ) {}

  list(): MacroIndicatorDescriptor[] {
    return this.indicators.map((indicator) => ({ ...indicator }));
  }

  get(code: string): MacroIndicatorDescriptor | null {
    return this.indicators.find((indicator) => indicator.code === code) ?? null;
  }

  async fetchSeries(code: string): Promise<MacroIndicatorSeries> {
    const descriptor = this.get(code);
    if (!descriptor) throw new MissingMacroIndicatorError(code);
    const url = `${IMF_API_BASE}/${descriptor.series}/${descriptor.area}`;
    const payload = await this.fetcher(url);
    return {
      descriptor: { ...descriptor },
      points: parseImfPayload(descriptor, payload),
      fetchedAt: this.now().toISOString(),
    };
  }
}

export function parseImfPayload(
  descriptor: MacroIndicatorDescriptor,
  payload: unknown,
): MacroIndicatorPoint[] {
  const series = readNested(payload, ['values', descriptor.series, descriptor.area]);
  if (!series || typeof series !== 'object') return [];
  const points: MacroIndicatorPoint[] = [];
  for (const [year, raw] of Object.entries(series as Record<string, unknown>)) {
    const value = Number(raw);
    if (!/^\d{4}$/.test(year) || !Number.isFinite(value)) continue;
    points.push({
      code: descriptor.code,
      period: year,
      periodDate: new Date(Date.UTC(Number(year), 0, 1)).toISOString(),
      value,
    });
  }
  points.sort((a, b) => a.period.localeCompare(b.period));
  return points;
}

function descriptor(
  code: string,
  series: string,
  area: MacroIndicatorDescriptor['area'],
  unit: MacroIndicatorDescriptor['unit'],
  labelKey: string,
): MacroIndicatorDescriptor {
  return { code, publisher: 'IMF', series, area, cadence: 'annual', unit, label: textKey(labelKey) };
}

function readNested(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

async function defaultFetcher(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Stelthion/1.0 (+stelthion.ai)' },
  });
  if (!res.ok) throw new Error(`IMF ${url} ${res.status}: ${res.statusText}`);
  return res.json();
}
