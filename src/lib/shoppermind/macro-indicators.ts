import { parseMonth, parseQuarter, type StatFinQuery } from './statfin';

export interface MacroIndicatorMeta {
  code: string;
  country: string;
  cadence: 'monthly' | 'quarterly';
  unit: 'index' | 'percent' | 'percent-of-gdp' | 'volume-index';
  publisher: string;
  sourceUrl: string;
  i18n: { fi: string; en: string; sv: string };
  fetch: StatFinQuery;
}

// Verified against the live StatFin PxWeb catalogue (2026-04-29). The filter
// shape uses the v1 PxWeb query format: dimension `code` with `selection.values`.

export const FI_INDICATORS: MacroIndicatorMeta[] = [
  {
    code: 'fi-consumer-confidence',
    country: 'FI',
    cadence: 'monthly',
    unit: 'index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/kbar',
    i18n: { fi: 'Kuluttajien luottamus', en: 'Consumer confidence', sv: 'Konsumenternas förtroende' },
    fetch: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/kbar/statfin_kbar_pxt_11cc.px',
      query: {
        query: [
          { code: 'Tiedot', selection: { filter: 'item', values: ['CCI_A1'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    },
  },
  {
    code: 'fi-retail-volume',
    country: 'FI',
    cadence: 'monthly',
    unit: 'volume-index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/klv',
    i18n: { fi: 'Vähittäiskaupan myynnin määrä', en: 'Retail trade volume', sv: 'Detaljhandelns volym' },
    fetch: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/klv/statfin_klv_pxt_14kr.px',
      query: {
        query: [
          { code: 'Toimiala', selection: { filter: 'item', values: ['G47'] } },
          { code: 'Muuttuja', selection: { filter: 'item', values: ['mi'] } },
          { code: 'Tiedot', selection: { filter: 'item', values: ['trendi'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    },
  },
  {
    code: 'fi-gdp-volume',
    country: 'FI',
    cadence: 'quarterly',
    unit: 'volume-index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/ntp',
    i18n: { fi: 'BKT, volyymi-indeksi', en: 'GDP, volume index', sv: 'BNP, volymindex' },
    fetch: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/statfin_ntp_pxt_132h.px',
      query: {
        query: [
          { code: 'Taloustoimi', selection: { filter: 'item', values: ['B1GMH'] } },
          { code: 'Tiedot', selection: { filter: 'item', values: ['kausitvv2015'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    },
  },
  {
    code: 'fi-debt-ratio',
    country: 'FI',
    cadence: 'quarterly',
    unit: 'percent-of-gdp',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/jyev',
    i18n: { fi: 'Julkinen velka, % BKT:sta', en: 'Public debt, % of GDP', sv: 'Offentlig skuld, % av BNP' },
    fetch: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/jyev/statfin_jyev_pxt_12sy.px',
      query: {
        query: [
          { code: 'Tiedot', selection: { filter: 'item', values: ['debt_GDP'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    },
  },
];

export function getIndicatorsForCountry(country: string): MacroIndicatorMeta[] {
  return FI_INDICATORS.filter((i) => i.country === country.toUpperCase());
}

export function getIndicatorMeta(code: string): MacroIndicatorMeta | undefined {
  return FI_INDICATORS.find((i) => i.code === code);
}
