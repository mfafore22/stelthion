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

// Sweden indicators via SCB PxWeb. Same JSON-stat 2.0 spec as StatFin.
// Tables verified live 2026-05-01.
export const SE_INDICATORS: MacroIndicatorMeta[] = [
  {
    code: 'se-retail-volume',
    country: 'SE',
    cadence: 'monthly',
    unit: 'volume-index',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/business-activities-and-foreign-trade/business-production-sales-and-orders-in-the-service-sector/preliminary-retail-sales-index/',
    i18n: { fi: 'Vähittäiskaupan myynnin määrä', en: 'Retail trade volume', sv: 'Detaljhandelns volym' },
    fetch: {
      table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/HA/HA0101/HA0101B/DetOms07N',
      query: {
        query: [
          { code: 'SNI2007',      selection: { filter: 'item', values: ['47'] } },
          { code: 'ContentsCode', selection: { filter: 'item', values: ['000006VU'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    },
  },
  {
    code: 'se-household-consumption',
    country: 'SE',
    cadence: 'monthly',
    unit: 'volume-index',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/national-accounts/national-accounts/monthly-indicator-of-household-consumption/',
    i18n: { fi: 'Kotitalouksien kulutus, indeksi', en: 'Household consumption indicator', sv: 'Hushållens konsumtion, index' },
    fetch: {
      table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/HA/HA0101/HA0101B/HushKonInd',
      query: {
        query: [
          { code: 'Andamal',      selection: { filter: 'item', values: ['HTK'] } },
          { code: 'ContentsCode', selection: { filter: 'item', values: ['HA0101AN'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    },
  },
  {
    code: 'se-gdp-volume',
    country: 'SE',
    cadence: 'quarterly',
    unit: 'volume-index',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/national-accounts/national-accounts/national-accounts-quarterly-and-annual-estimates/',
    i18n: { fi: 'BKT, volyymi (mrd. SEK)', en: 'GDP, volume (SEK bn)', sv: 'BNP, volym (mdr SEK)' },
    fetch: {
      table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/NR/NR0103/NR0103B/NR0103ENS2010T10SKv',
      query: {
        query: [
          { code: 'Anvandningstyp', selection: { filter: 'item', values: ['BNPM'] } },
          { code: 'ContentsCode',   selection: { filter: 'item', values: ['NR0103CE'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    },
  },
];

const ALL_INDICATORS = [...FI_INDICATORS, ...SE_INDICATORS];

export function getIndicatorsForCountry(country: string): MacroIndicatorMeta[] {
  return ALL_INDICATORS.filter((i) => i.country === country.toUpperCase());
}

export function getIndicatorMeta(code: string): MacroIndicatorMeta | undefined {
  return ALL_INDICATORS.find((i) => i.code === code);
}
