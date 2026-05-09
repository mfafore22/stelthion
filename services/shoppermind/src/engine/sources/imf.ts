/**
 * IMF DataMapper fetcher. Pulls latest annual data points for a configured
 * IMF indicator and emits one RawSignal per available year. Used to surface
 * IMF World Economic Outlook context as evidence in trend formation.
 *
 * Source config:
 *   url        — IMF DataMapper API base URL (default API root if unset)
 *   config.code — runtime macro indicator code (e.g. imf-world-gdp-growth)
 *   config.series — IMF series code (overrides descriptor lookup)
 *   config.area   — IMF area code (overrides descriptor lookup)
 */

import {
  ImfMacroContextAdapter,
  IMF_INDICATORS,
  type MacroIndicatorDescriptor,
} from '@stelthion/intelligence-runtime';
import type { SourceFetcher, RawSignalInput } from '../types.js';

export const fetchImf: SourceFetcher = async (ctx) => {
  const config = (ctx.config ?? {}) as {
    code?: string;
    series?: string;
    area?: string;
  };
  const descriptor = resolveDescriptor(config);
  if (!descriptor) {
    return { signals: [], errorMsg: 'IMF source missing config.code or descriptor' };
  }

  const adapter = new ImfMacroContextAdapter(undefined, undefined, [descriptor]);
  try {
    const series = await adapter.fetchSeries(descriptor.code);
    const recent = series.points.slice(-3);
    const signals: RawSignalInput[] = recent.map((point) => ({
      externalId: `imf:${descriptor.code}:${point.period}`,
      title: `${descriptor.series} ${descriptor.area} ${point.period}: ${point.value}`,
      summary: `IMF DataMapper ${descriptor.series} for ${descriptor.area}, ${point.period}: ${point.value}.`,
      url: `https://www.imf.org/external/datamapper/${descriptor.series}/${descriptor.area}`,
      country: 'GLOBAL',
      language: 'en',
      publishedAt: new Date(point.periodDate),
      metadata: {
        provider: 'imf',
        code: descriptor.code,
        series: descriptor.series,
        area: descriptor.area,
        unit: descriptor.unit,
        value: point.value,
        period: point.period,
      },
    }));
    return { signals };
  } catch (err) {
    return {
      signals: [],
      errorMsg: `IMF fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};

function resolveDescriptor(config: {
  code?: string;
  series?: string;
  area?: string;
}): MacroIndicatorDescriptor | null {
  if (config.code) {
    return IMF_INDICATORS.find((indicator) => indicator.code === config.code) ?? null;
  }
  if (config.series && config.area) {
    return IMF_INDICATORS.find(
      (indicator) => indicator.series === config.series && indicator.area === config.area,
    ) ?? null;
  }
  return null;
}
