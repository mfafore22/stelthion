import type { MacroIndicatorMeta } from './macro-indicators';

const CBUAE_QER = 'https://www.centralbank.ae/media/lgnfakgc/qer-march_2026.pdf';

function d(period: string, value: number) {
  const y = Number(period.slice(0, 4));
  return { period, value, periodDate: `${y || 2026}-01-01T00:00:00.000Z` };
}

export const UAE_INDICATORS: MacroIndicatorMeta[] = [
  {
    slot: 'gdp',
    code: 'uae-real-gdp-growth',
    country: 'UAE',
    cadence: 'yearly',
    unit: 'percent',
    publisher: 'Central Bank of the UAE',
    sourceUrl: CBUAE_QER,
    i18n: { fi: 'BKT-kasvu', en: 'GDP growth', sv: 'BNP-tillväxt' },
    fallbackHistory: [d('2022', 7.5), d('2023', 4.3), d('2024', 4.0), d('2025e', 5.6), d('2026f', 5.6), d('2027f', 4.4)],
  },
  {
    slot: 'inflation',
    code: 'uae-cpi-inflation',
    country: 'UAE',
    cadence: 'yearly',
    unit: 'percent',
    publisher: 'Central Bank of the UAE',
    sourceUrl: CBUAE_QER,
    i18n: { fi: 'Inflaatio', en: 'Inflation', sv: 'Inflation' },
    fallbackHistory: [d('2023', 1.6), d('2024', 1.7), d('2025', 1.3), d('2026f', 1.8), d('2027f', 2.0)],
  },
  {
    slot: 'consumer-confidence',
    code: 'uae-non-oil-pmi',
    country: 'UAE',
    cadence: 'monthly',
    unit: 'index',
    publisher: 'S&P Global / CBUAE',
    sourceUrl: CBUAE_QER,
    i18n: { fi: 'Ei-öljysektorin PMI', en: 'Non-oil PMI', sv: 'Icke-olje-PMI' },
    fallbackHistory: [
      { period: '2025-12', value: 54.2, periodDate: '2025-12-01T00:00:00.000Z' },
      { period: '2026-01', value: 54.9, periodDate: '2026-01-01T00:00:00.000Z' },
    ],
  },
  {
    slot: 'retail-trade',
    code: 'uae-wholesale-retail-growth',
    country: 'UAE',
    cadence: 'quarterly',
    unit: 'percent',
    publisher: 'FCSC / CBUAE',
    sourceUrl: CBUAE_QER,
    i18n: { fi: 'Tukku- ja vähittäiskauppa', en: 'Wholesale & retail trade', sv: 'Parti- och detaljhandel' },
    fallbackHistory: [{ period: '2025Q1-Q3', value: 3.5, periodDate: '2025-09-30T00:00:00.000Z' }],
  },
  {
    slot: 'tourism',
    code: 'dubai-international-visitors',
    country: 'UAE',
    cadence: 'yearly',
    unit: 'million',
    publisher: 'Dubai DET / CBUAE',
    sourceUrl: CBUAE_QER,
    i18n: { fi: 'Dubain kansainväliset kävijät', en: 'Dubai international visitors', sv: 'Dubais internationella besökare' },
    fallbackHistory: [d('2023', 17.15), d('2024', 18.72), d('2025', 19.59)],
  },
  {
    slot: 'debt-to-gdp',
    code: 'uae-debt-ratio',
    country: 'UAE',
    cadence: 'yearly',
    unit: 'percent-of-gdp',
    publisher: 'Central Bank of the UAE / Trading Economics',
    sourceUrl: 'https://tradingeconomics.com/united-arab-emirates/government-debt-to-gdp',
    i18n: { fi: 'Julkinen velka, % BKT:sta', en: 'Public debt, % of GDP', sv: 'Offentlig skuld, % av BNP' },
    fallbackHistory: [d('2023', 32.4), d('2024', 32.1), d('2026f', 32.0)],
  },
];
