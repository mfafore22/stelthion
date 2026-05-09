// Macro economic context port. Lets multiple services (ShopperMind,
// VenueMind, ...) read shared global macro indicators (IMF, etc.) without
// each service implementing its own HTTP client. Trend formation stays
// service-specific - this only delivers raw indicator values.

import type { LocalizedText } from './localized-text.js';

export type MacroAggregate =
  | 'WLD'
  | 'ADVEC'
  | 'EMDE'
  | 'EU'
  | 'OECD'
  | (string & {});

export type MacroCadence = 'annual' | 'quarterly' | 'monthly';

export interface MacroIndicatorDescriptor {
  code: string;
  publisher: 'IMF' | 'OECD' | 'WB' | (string & {});
  series: string;
  area: MacroAggregate;
  cadence: MacroCadence;
  unit: 'percent' | 'percent-of-gdp' | 'index' | 'currency';
  label: LocalizedText;
}

export interface MacroIndicatorPoint {
  code: string;
  period: string;
  periodDate: string;
  value: number;
}

export interface MacroIndicatorSeries {
  descriptor: MacroIndicatorDescriptor;
  points: MacroIndicatorPoint[];
  fetchedAt: string;
}

export interface MacroContextPort {
  list(): MacroIndicatorDescriptor[];
  get(code: string): MacroIndicatorDescriptor | null;
  fetchSeries(code: string): Promise<MacroIndicatorSeries>;
}

export class MissingMacroIndicatorError extends Error {
  constructor(public code: string) {
    super(`Unknown macro indicator: ${code}`);
    this.name = 'MissingMacroIndicatorError';
  }
}
