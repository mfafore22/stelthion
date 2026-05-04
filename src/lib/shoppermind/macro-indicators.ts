import { parseMonth, parseQuarter, type StatFinQuery } from './statfin';
import { UAE_INDICATORS } from './uae-macro-indicators';

export { UAE_INDICATORS };

export type MacroIndicatorSlot =
  | 'consumer-confidence'
  | 'retail-trade'
  | 'gdp'
  | 'debt-to-gdp'
  | 'inflation'
  | 'tourism';

export type MacroUnit =
  | 'index'
  | 'percent'
  | 'percent-of-gdp'
  | 'volume-index'
  | 'currency'
  | 'million';

export interface FredQuery {
  seriesId: string;
  url: string;
  pickPeriod: (label: string) => { period: string; periodDate: Date } | null;
}

export type MacroFetch =
  | { provider: 'pxweb'; query: StatFinQuery }
  | { provider: 'fred'; query: FredQuery }
  | {
      provider: 'derived-debt-to-gdp';
      debtQuery: StatFinQuery;
      gdpQuery: StatFinQuery;
      gdpAnnualizationFactor: number;
    };

export interface MacroIndicatorMeta {
  slot: MacroIndicatorSlot;
  code: string;
  country: string;
  cadence: 'monthly' | 'quarterly' | 'yearly';
  unit: MacroUnit;
  publisher: string;
  sourceUrl: string;
  i18n: { fi: string; en: string; sv: string };
  scaleNote?: { fi: string; en: string; sv: string };
  fetch?: MacroFetch;
  fallbackHistory?: Array<{ period: string; value: number; periodDate: string }>;
}

export const MACRO_SLOT_ORDER: MacroIndicatorSlot[] = [
  'consumer-confidence',
  'retail-trade',
  'gdp',
  'inflation',
  'tourism',
  'debt-to-gdp',
];

function parseFredQuarterDate(label: string): { period: string; periodDate: Date } | null {
  const m = label.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!m) return parseQuarter(label);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const q = Math.floor((month - 1) / 3) + 1;
  if (q < 1 || q > 4) return null;
  return { period: `${year}Q${q}`, periodDate: new Date(Date.UTC(year, (q - 1) * 3, 1)) };
}

// Verified against the live StatFin PxWeb catalogue (2026-04-29). The filter
// shape uses the v1 PxWeb query format: dimension `code` with `selection.values`.

export const FI_INDICATORS: MacroIndicatorMeta[] = [
  {
    slot: 'consumer-confidence',
    code: 'fi-consumer-confidence',
    country: 'FI',
    cadence: 'monthly',
    unit: 'index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/kbar',
    i18n: { fi: 'Kuluttajien luottamus', en: 'Consumer confidence', sv: 'Konsumenternas förtroende' },
    scaleNote: {
      fi: 'Saldoindikaattori: 0 on neutraali, negatiivinen tarkoittaa heikkoa luottamusta.',
      en: 'Balance indicator: 0 is neutral, negative means weak confidence.',
      sv: 'Saldoindikator: 0 är neutral, negativt värde betyder svagt förtroende.',
    },
    fetch: { provider: 'pxweb', query: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/kbar/statfin_kbar_pxt_11cc.px',
      query: {
        query: [
          { code: 'Tiedot', selection: { filter: 'item', values: ['CCI_A1'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    } },
  },
  {
    slot: 'retail-trade',
    code: 'fi-retail-volume',
    country: 'FI',
    cadence: 'monthly',
    unit: 'volume-index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/klv',
    i18n: { fi: 'Vähittäiskaupan myynnin määrä', en: 'Retail trade volume', sv: 'Detaljhandelns volym' },
    fetch: { provider: 'pxweb', query: {
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
    } },
  },
  {
    slot: 'gdp',
    code: 'fi-gdp-volume',
    country: 'FI',
    cadence: 'quarterly',
    unit: 'volume-index',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/ntp',
    i18n: { fi: 'BKT, volyymi-indeksi', en: 'GDP, volume index', sv: 'BNP, volymindex' },
    fetch: { provider: 'pxweb', query: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ntp/statfin_ntp_pxt_132h.px',
      query: {
        query: [
          { code: 'Taloustoimi', selection: { filter: 'item', values: ['B1GMH'] } },
          { code: 'Tiedot', selection: { filter: 'item', values: ['kausitvv2015'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    } },
  },
  {
    slot: 'debt-to-gdp',
    code: 'fi-debt-ratio',
    country: 'FI',
    cadence: 'quarterly',
    unit: 'percent-of-gdp',
    publisher: 'Tilastokeskus',
    sourceUrl: 'https://stat.fi/fi/tilasto/jyev',
    i18n: { fi: 'Julkinen velka, % BKT:sta', en: 'Public debt, % of GDP', sv: 'Offentlig skuld, % av BNP' },
    fetch: { provider: 'pxweb', query: {
      table: 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/jyev/statfin_jyev_pxt_12sy.px',
      query: {
        query: [
          { code: 'Tiedot', selection: { filter: 'item', values: ['debt_GDP'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    } },
  },
];

// Sweden indicators via SCB PxWeb. Same JSON-stat 2.0 spec as StatFin.
// Tables verified live 2026-05-01.
export const SE_INDICATORS: MacroIndicatorMeta[] = [
  {
    slot: 'consumer-confidence',
    code: 'se-consumer-confidence',
    country: 'SE',
    cadence: 'monthly',
    unit: 'index',
    publisher: 'Konjunkturinstitutet',
    sourceUrl: 'https://www.konj.se/en/statistics/swedish-economic-tendency-survey.html',
    i18n: { fi: 'Kuluttajien luottamus', en: 'Consumer confidence', sv: 'Konsumentförtroende' },
    scaleNote: {
      fi: 'Indeksi: 100 on normaali taso, alle 100 on normaalia heikompi.',
      en: 'Index: 100 is normal, below 100 is weaker than normal.',
      sv: 'Index: 100 är normalläge, under 100 är svagare än normalt.',
    },
    fetch: { provider: 'pxweb', query: {
      table: 'https://statistik.konj.se/PxWeb/api/v1/sv/KonjBar/indikatorer/Indikatorm.px',
      query: {
        query: [
          { code: 'Indikator', selection: { filter: 'item', values: ['bhus'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    } },
  },
  {
    slot: 'retail-trade',
    code: 'se-retail-volume',
    country: 'SE',
    cadence: 'monthly',
    unit: 'volume-index',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/business-activities-and-foreign-trade/business-production-sales-and-orders-in-the-service-sector/preliminary-retail-sales-index/',
    i18n: { fi: 'Vähittäiskaupan myynnin määrä', en: 'Retail trade volume', sv: 'Detaljhandelns volym' },
    fetch: { provider: 'pxweb', query: {
      table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/HA/HA0101/HA0101B/DetOms07N',
      query: {
        query: [
          { code: 'SNI2007',      selection: { filter: 'item', values: ['47'] } },
          { code: 'ContentsCode', selection: { filter: 'item', values: ['000006VU'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseMonth,
    } },
  },
  {
    slot: 'gdp',
    code: 'se-gdp-volume',
    country: 'SE',
    cadence: 'quarterly',
    unit: 'volume-index',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/national-accounts/national-accounts/national-accounts-quarterly-and-annual-estimates/',
    i18n: { fi: 'BKT, volyymi (mrd. SEK)', en: 'GDP, volume (SEK bn)', sv: 'BNP, volym (mdr SEK)' },
    fetch: { provider: 'pxweb', query: {
      table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/NR/NR0103/NR0103B/NR0103ENS2010T10SKv',
      query: {
        query: [
          { code: 'Anvandningstyp', selection: { filter: 'item', values: ['BNPM'] } },
          { code: 'ContentsCode',   selection: { filter: 'item', values: ['NR0103CE'] } },
        ],
        response: { format: 'json-stat2' },
      },
      pickPeriod: parseQuarter,
    } },
  },
  {
    slot: 'debt-to-gdp',
    code: 'se-debt-ratio',
    country: 'SE',
    cadence: 'quarterly',
    unit: 'percent-of-gdp',
    publisher: 'SCB',
    sourceUrl: 'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/public-finances/public-finances/general-government-debt/',
    i18n: { fi: 'Julkinen velka, % BKT:sta', en: 'Public debt, % of GDP', sv: 'Offentlig skuld, % av BNP' },
    fetch: {
      provider: 'derived-debt-to-gdp',
      debtQuery: {
        table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/NR/NR0108/FirBruttoKonvKv',
        query: {
          query: [
            { code: 'Sektor', selection: { filter: 'item', values: ['S13'] } },
            { code: 'Kontopost', selection: { filter: 'item', values: ['FL01N'] } },
            { code: 'ContentsCode', selection: { filter: 'item', values: ['000002KJ'] } },
          ],
          response: { format: 'json-stat2' },
        },
        pickPeriod: parseQuarter,
      },
      gdpQuery: {
        table: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/NR/NR0103/NR0103B/NR0103ENS2010T10SKv',
        query: {
          query: [
            { code: 'Anvandningstyp', selection: { filter: 'item', values: ['BNPM'] } },
            { code: 'ContentsCode', selection: { filter: 'item', values: ['NR0103CG'] } },
          ],
          response: { format: 'json-stat2' },
        },
        pickPeriod: parseQuarter,
      },
      gdpAnnualizationFactor: 4,
    },
  },
];

export const US_INDICATORS: MacroIndicatorMeta[] = [
  {
    slot: 'consumer-confidence',
    code: 'us-consumer-confidence',
    country: 'US',
    cadence: 'monthly',
    unit: 'index',
    publisher: 'FRED / University of Michigan',
    sourceUrl: 'https://fred.stlouisfed.org/series/UMCSENT',
    i18n: { fi: 'Kuluttajien luottamus', en: 'Consumer confidence', sv: 'Konsumentförtroende' },
    scaleNote: {
      fi: 'Indeksi: 1966 Q1 = 100.',
      en: 'Index: 1966 Q1 = 100.',
      sv: 'Index: 1966 Q1 = 100.',
    },
    fetch: { provider: 'fred', query: {
      seriesId: 'UMCSENT',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=UMCSENT',
      pickPeriod: parseMonth,
    } },
  },
  {
    slot: 'retail-trade',
    code: 'us-retail-sales',
    country: 'US',
    cadence: 'monthly',
    unit: 'currency',
    publisher: 'FRED / U.S. Census Bureau',
    sourceUrl: 'https://fred.stlouisfed.org/series/RSXFS',
    i18n: { fi: 'Vähittäiskaupan myynti', en: 'Retail trade sales', sv: 'Detaljhandelns försäljning' },
    fetch: { provider: 'fred', query: {
      seriesId: 'RSXFS',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=RSXFS',
      pickPeriod: parseMonth,
    } },
  },
  {
    slot: 'gdp',
    code: 'us-real-gdp',
    country: 'US',
    cadence: 'quarterly',
    unit: 'currency',
    publisher: 'FRED / U.S. Bureau of Economic Analysis',
    sourceUrl: 'https://fred.stlouisfed.org/series/GDPC1',
    i18n: { fi: 'BKT, reaalinen', en: 'Real GDP', sv: 'BNP, real' },
    fetch: { provider: 'fred', query: {
      seriesId: 'GDPC1',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDPC1',
      pickPeriod: parseFredQuarterDate,
    } },
  },
  {
    slot: 'debt-to-gdp',
    code: 'us-debt-ratio',
    country: 'US',
    cadence: 'quarterly',
    unit: 'percent-of-gdp',
    publisher: 'FRED / U.S. OMB',
    sourceUrl: 'https://fred.stlouisfed.org/series/GFDEGDQ188S',
    i18n: { fi: 'Julkinen velka, % BKT:sta', en: 'Public debt, % of GDP', sv: 'Offentlig skuld, % av BNP' },
    fetch: { provider: 'fred', query: {
      seriesId: 'GFDEGDQ188S',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GFDEGDQ188S',
      pickPeriod: parseFredQuarterDate,
    } },
  },
];

const ALL_INDICATORS = [...FI_INDICATORS, ...SE_INDICATORS, ...US_INDICATORS, ...UAE_INDICATORS];

export function getIndicatorsForCountry(country: string): MacroIndicatorMeta[] {
  return ALL_INDICATORS
    .filter((i) => i.country === country.toUpperCase())
    .sort((a, b) => MACRO_SLOT_ORDER.indexOf(a.slot) - MACRO_SLOT_ORDER.indexOf(b.slot));
}

export function getIndicatorMeta(code: string): MacroIndicatorMeta | undefined {
  return ALL_INDICATORS.find((i) => i.code === code);
}
