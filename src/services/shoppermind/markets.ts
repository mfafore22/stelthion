import type { SourceType } from '@prisma/client';

export type MarketCountry = 'FI' | 'AE';

export interface SeedSource {
  name: string;
  type: SourceType;
  url: string;
  language: string;
  weight?: number;
  config?: Record<string, unknown>;
}

export interface MarketProfile {
  country: MarketCountry;
  industryFocus: 'retail' | 'property';
  displayName: string;
  categories: string[];
  narrativePersona: string;
  weightPriors: {
    velocity: number;
    acceleration: number;
    noise: number;
    diversity: number;
  };
  seedSources: SeedSource[];
  /** Signal is kept only if at least one of these matches (case-insensitive). */
  relevanceKeywords: string[];
  /** Category → keywords mapping used to auto-tag phenomena. */
  categoryKeywords: Record<string, string[]>;
}

export const MARKET_PROFILE: Record<MarketCountry, MarketProfile> = {
  FI: {
    country: 'FI',
    industryFocus: 'retail',
    displayName: 'Finland',
    categories: [
      'fashion',
      'grocery',
      'f&b',
      'health-beauty',
      'home',
      'services',
      'leisure',
      'retail-tenancy',
      'footfall-driver',
      'consumer-behaviour',
    ],
    narrativePersona:
      'Retail operator briefing — speak to shopping-centre and high-street retail operators about shopper behaviour, footfall drivers, tenancy shifts, and category momentum in Finland.',
    weightPriors: { velocity: 0.35, acceleration: 0.35, noise: 0.15, diversity: 0.15 },
    seedSources: [
      {
        name: 'Kauppalehti',
        type: 'RSS',
        url: 'https://feeds.kauppalehti.fi/rss/main',
        language: 'fi',
      },
      {
        name: 'Markkinointi&Mainonta',
        type: 'RSS',
        url: 'https://www.marmai.fi/rss',
        language: 'fi',
      },
      {
        name: 'Taloussanomat (IS Talous)',
        type: 'RSS',
        url: 'https://www.is.fi/rss/taloussanomat.xml',
        language: 'fi',
      },
      {
        name: 'HS Talous',
        type: 'RSS',
        url: 'https://www.hs.fi/rss/talous.xml',
        language: 'fi',
      },
      {
        name: 'STT Info — Talous',
        type: 'RSS',
        url: 'https://www.sttinfo.fi/data/categoryfeed?categoryId=4&format=rss&lang=fi',
        language: 'fi',
      },
      {
        name: 'Suomen Pankki — press',
        type: 'RSS',
        url: 'https://www.suomenpankki.fi/en/rss/press-releases/',
        language: 'en',
      },
      {
        name: 'ETLA — julkaisut',
        type: 'RSS',
        url: 'https://www.etla.fi/feed/',
        language: 'fi',
      },
      {
        name: 'Helsinki Times',
        type: 'RSS',
        url: 'https://www.helsinkitimes.fi/?format=feed&type=rss',
        language: 'en',
      },
      {
        name: 'Yle Uutiset — Talous',
        type: 'RSS',
        url: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS&concepts=18-35138',
        language: 'fi',
      },
      // ── Statistics Finland (Tilastokeskus) PxWeb tables ──
      {
        name: 'StatFin — Retail trade turnover YoY (klv)',
        type: 'STATFIN',
        url: 'https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/klv/statfin_klv_pxt_14kr.px',
        language: 'en',
        config: {
          tableLabel: 'Retail trade turnover YoY',
          unit: '% YoY',
          timeDimension: 'Kuukausi',
          query: {
            query: [
              {
                code: 'Toimiala',
                selection: {
                  filter: 'item',
                  values: ['G47', 'G4711', 'G4719', 'G474', 'G475', 'G476', 'G477', 'G479'],
                },
              },
              { code: 'Muuttuja', selection: { filter: 'item', values: ['lv'] } },
              { code: 'Tiedot', selection: { filter: 'item', values: ['tpk_muutos'] } },
              { code: 'Kuukausi', selection: { filter: 'top', values: ['13'] } },
            ],
            response: { format: 'json-stat2' },
          },
        },
      },
      {
        name: 'StatFin — Old dwelling prices monthly (ashi 13ms)',
        type: 'STATFIN',
        url: 'https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/ashi/statfin_ashi_pxt_13ms.px',
        language: 'en',
        config: {
          tableLabel: 'Old dwellings — price index & transactions',
          unit: '',
          timeDimension: 'Kuukausi',
          query: {
            query: [
              {
                code: 'Alue',
                selection: { filter: 'item', values: ['ksu', 'pks', '091', '837', '853'] },
              },
              { code: 'Talotyyppi', selection: { filter: 'item', values: ['0'] } },
              {
                code: 'Tiedot',
                selection: {
                  filter: 'item',
                  values: ['ketj_P_QA_T', 'vmuut_P_QA_T', 'kkmuut_P_QA_T', 'lkm_julk_kvkl', 'myyntiaika'],
                },
              },
              { code: 'Kuukausi', selection: { filter: 'top', values: ['3'] } },
            ],
            response: { format: 'json-stat2' },
          },
        },
      },
      {
        name: 'StatFin — Old single family houses quarterly (kihi 13zp)',
        type: 'STATFIN',
        url: 'https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/kihi/statfin_kihi_pxt_13zp.px',
        language: 'en',
        config: {
          tableLabel: 'Old single-family houses — price index',
          unit: '',
          timeDimension: 'Vuosineljännes',
          query: {
            query: [
              {
                code: 'Alue',
                selection: { filter: 'item', values: ['01', '02', '18'] },
              },
              {
                code: 'Tiedot',
                selection: {
                  filter: 'item',
                  values: ['ketjutettu_lv', 'vmuut', 'neljmuut', 'keskihinta', 'lkm_julk'],
                },
              },
              { code: 'Vuosineljännes', selection: { filter: 'top', values: ['2'] } },
            ],
            response: { format: 'json-stat2' },
          },
        },
      },
      {
        name: 'FRED — Finland residential property price index (QFIN628BIS)',
        type: 'FRED',
        url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=QFIN628BIS',
        language: 'en',
        config: {
          seriesId: 'QFIN628BIS',
          tableLabel: 'Finland residential property price index (BIS)',
          unit: 'index (2010=100)',
        },
      },
      {
        name: 'StatFin — Consumer confidence (kbar)',
        type: 'STATFIN',
        url: 'https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/kbar/statfin_kbar_pxt_11cc.px',
        language: 'en',
        config: {
          tableLabel: 'Consumer confidence',
          unit: 'balance',
          timeDimension: 'Kuukausi',
          query: {
            query: [
              {
                code: 'Tiedot',
                selection: {
                  filter: 'item',
                  values: ['CCI_A1', 'CCI_B2', 'CCI_C1', 'CCI_E1', 'CCI_E4'],
                },
              },
              { code: 'Kuukausi', selection: { filter: 'top', values: ['13'] } },
            ],
            response: { format: 'json-stat2' },
          },
        },
      },
    ],
    relevanceKeywords: [
      'kauppakeskus', 'ostoskeskus', 'vähittäiskauppa', 'päivittäistavara',
      'kauppias', 'myymälä', 'liiketila', 'tavaratalo',
      'muoti', 'vaatekauppa', 'kenkäkauppa',
      'ruokakauppa', 'päivittäistavarakauppa', 'elintarvikekauppa', 'ruokaostokset',
      'kahvila', 'ravintola', 'ravintolatrendi',
      'kosmetiikka', 'apteekki', 'hyvinvointituote',
      'sisustuskauppa', 'huonekaluliike', 'kodinkoneliike',
      'urheilukauppa',
      'pop-up', 'popup', 'uusi myymälä', 'sulkee myymälän', 'avaa myymälän', 'konkurssi',
      'liikevuokra', 'vuokralainen',
      'kuluttaja', 'ostokäyttäytyminen', 'ostoskori', 'kävijämäärä', 'footfall',
      'retail', 'shopper', 'grocery', 'supermarket', 'tenant', 'tenancy',
      'h&m', 'lidl', 'stockmann', 'tokmanni', 'sokos', 'prisma', 'k-citymarket',
      'kesko', 'kaupan liitto', 'ideapark',
    ],
    categoryKeywords: {
      fashion: ['muotikauppa', 'vaatekauppa', 'kenkäkauppa', 'muotiketju', 'muotibrändi', 'h&m', 'zara', 'second-hand', 'kirpputori', 'vintage-muoti'],
      grocery: ['ruokakauppa', 'päivittäistavarakauppa', 'elintarvikekauppa', 'lidl', 'prisma', 'k-citymarket', 's-market', 'k-market', 'kesko', 'tokmanni', 'tavaratalo'],
      'f&b': ['kahvila', 'ravintola', 'ravintolaketju', 'kahvilaketju', 'pikaruoka', 'burger', 'pizzeria'],
      'health-beauty': ['kosmetiikkaketju', 'apteekki', 'hyvinvointiliike', 'kauneusliike'],
      home: ['huonekaluliike', 'sisustuskauppa', 'kodinkoneliike', 'ikea'],
      services: ['kampaamo', 'parturi', 'palveluketju'],
      leisure: ['urheilukauppa', 'kuntosali', 'elokuvateatteri', 'urheilukauppa'],
      'retail-tenancy': ['pop-up', 'popup', 'uusi myymälä', 'avaa myymälän', 'sulkee myymälän', 'myymälän sulkeminen', 'liikevuokra', 'konkurssi', 'kauppakeskus', 'ostoskeskus'],
      'footfall-driver': ['kävijämäärä', 'kävijämäärät', 'footfall', 'asiakasmäärä', 'kauppakeskustapahtuma'],
      'consumer-behaviour': ['kuluttajakäyttäytyminen', 'ostokäyttäytyminen', 'ostoskori', 'kulutustottumukset', 'shopper'],
    },
  },

  AE: {
    country: 'AE',
    industryFocus: 'property',
    displayName: 'UAE',
    categories: [
      'residential-sale',
      'residential-rental',
      'commercial-office',
      'commercial-retail',
      'hospitality',
      'tourism',
      'construction-pipeline',
      'short-term-rental',
      'mixed-use',
      'infrastructure',
      'investment-flows',
    ],
    narrativePersona:
      'Property-industry briefing — speak to real estate developers, asset managers, and mixed-use property operators about district momentum, asset-class shifts, hospitality, and retail-as-tenant dynamics across the UAE.',
    weightPriors: { velocity: 0.3, acceleration: 0.4, noise: 0.15, diversity: 0.15 },
    seedSources: [
      {
        name: 'Arabian Business',
        type: 'RSS',
        url: 'https://www.arabianbusiness.com/rss',
        language: 'en',
      },
      {
        name: 'Gulf News — Business',
        type: 'RSS',
        url: 'https://gulfnews.com/business/rss.xml',
        language: 'en',
      },
      {
        name: 'Khaleej Times — Business',
        type: 'RSS',
        url: 'https://www.khaleejtimes.com/rss/business',
        language: 'en',
      },
      {
        name: 'Zawya — Business',
        type: 'RSS',
        url: 'https://www.zawya.com/en/rss',
        language: 'en',
      },
      {
        name: 'Google Trends — AE property queries',
        type: 'GOOGLE_TRENDS',
        url: 'https://trends.google.com/trends/api',
        language: 'en',
        config: {
          geo: 'AE',
          queries: [
            'Dubai property',
            'off plan Dubai',
            'Dubai Marina rent',
            'DIFC office',
            'Abu Dhabi residential',
          ],
        },
      },
      {
        name: 'Reddit r/dubai',
        type: 'REDDIT',
        url: 'https://www.reddit.com/r/dubai/.json',
        language: 'en',
        config: { subreddit: 'dubai', limit: 50 },
      },
    ],
    relevanceKeywords: [
      'property', 'properties', 'real estate', 'realty', 'developer', 'developers',
      'residential', 'commercial', 'apartment', 'villa', 'tower', 'building', 'project',
      'off-plan', 'off plan', 'offplan', 'handover', 'launch', 'launches',
      'rent', 'rental', 'rentals', 'lease', 'leasing', 'yield', 'rents',
      'sale', 'sales', 'transaction', 'transactions', 'price', 'prices', 'psf', 'aed',
      'hospitality', 'hotel', 'hotels', 'revpar', 'occupancy', 'tourism', 'tourist',
      'short-term rental', 'holiday home', 'airbnb',
      'retail', 'mall', 'malls', 'f&b', 'store', 'tenant', 'tenants', 'tenancy',
      'office', 'offices', 'difc', 'jvc', 'jlt', 'marina', 'downtown', 'palm',
      'dubai', 'abu dhabi', 'sharjah', 'ras al khaimah', 'uae', 'emirates',
      'construction', 'infrastructure', 'masterplan', 'district',
      'investor', 'investment', 'fund', 'reit', 'yield',
      'emaar', 'damac', 'aldar', 'nakheel', 'meraas', 'sobha',
    ],
    categoryKeywords: {
      'residential-sale': ['residential sale', 'apartment sale', 'villa sale', 'off-plan', 'off plan', 'offplan', 'handover', 'psf', 'emaar properties', 'damac properties', 'sobha realty', 'aldar properties', 'nakheel'],
      'residential-rental': ['residential rent', 'apartment rent', 'villa rent', 'rental yield', 'rental market', 'leasing', 'tenancy contract'],
      'commercial-office': ['office leasing', 'office space', 'commercial office', 'difc office', 'grade a office', 'coworking'],
      'commercial-retail': ['retail leasing', 'mall', 'malls', 'retail tenant', 'retail tenancy', 'shopping centre', 'shopping center', 'retail footfall'],
      hospitality: ['hospitality', 'hotel', 'hotels', 'revpar', 'hotel occupancy', 'resort', 'branded residence'],
      tourism: ['tourism', 'tourist arrivals', 'visitor arrivals', 'inbound tourism', 'expo city'],
      'construction-pipeline': ['real estate project', 'property launch', 'masterplan', 'new tower', 'construction pipeline', 'handover', 'project launch'],
      'short-term-rental': ['short-term rental', 'short term rental', 'holiday home', 'airbnb', 'vacation rental'],
      'mixed-use': ['mixed-use', 'mixed use', 'mixed-use district', 'community launch'],
      infrastructure: ['metro line', 'rail link', 'airport expansion', 'port expansion', 'infrastructure project'],
      'investment-flows': ['real estate investment', 'property investment', 'reit', 'foreign direct investment in property', 'capital inflow property'],
    },
  },
};

export function getMarketProfile(country: string): MarketProfile | null {
  return MARKET_PROFILE[country as MarketCountry] ?? null;
}

export function listMarkets(): MarketProfile[] {
  return Object.values(MARKET_PROFILE);
}
