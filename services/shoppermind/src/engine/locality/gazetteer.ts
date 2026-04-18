import type { Scope } from '../policy/policy-types.js';

export interface GazetteerPlace {
  scope: Scope;
  localityId: string;
}

export interface GazetteerEntry {
  aliases: string[];
  footTraffic: GazetteerPlace;
  /**
   * Optional hint for the cultural axis when the place's cultural reach
   * exceeds its foot-traffic reach. For example, Asuntomessut Lempäälä
   * has footTraffic = CITY:lempaala-fi but culturalLiftDefault =
   * COUNTRY:FI because the event shapes nationwide housing discourse.
   * When absent, the resolver falls back to the same scope on both axes.
   */
  culturalLiftDefault?: GazetteerPlace;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

const entries: GazetteerEntry[] = [
  // Finland — cities
  {
    aliases: ['helsinki', 'hki'],
    footTraffic: { scope: 'CITY', localityId: 'helsinki-fi' },
    country: 'FI',
    region: 'uusimaa-fi',
    latitude: 60.1699,
    longitude: 24.9384,
  },
  {
    aliases: ['espoo'],
    footTraffic: { scope: 'CITY', localityId: 'espoo-fi' },
    country: 'FI',
    region: 'uusimaa-fi',
    latitude: 60.2055,
    longitude: 24.6559,
  },
  {
    aliases: ['vantaa'],
    footTraffic: { scope: 'CITY', localityId: 'vantaa-fi' },
    country: 'FI',
    region: 'uusimaa-fi',
    latitude: 60.2934,
    longitude: 25.0378,
  },
  {
    aliases: ['tampere'],
    footTraffic: { scope: 'CITY', localityId: 'tampere-fi' },
    country: 'FI',
    region: 'pirkanmaa-fi',
    latitude: 61.4978,
    longitude: 23.7609,
  },
  {
    aliases: ['lempäälä', 'lempaala'],
    footTraffic: { scope: 'CITY', localityId: 'lempaala-fi' },
    country: 'FI',
    region: 'pirkanmaa-fi',
    latitude: 61.3126,
    longitude: 23.7525,
  },
  {
    aliases: ['turku', 'åbo'],
    footTraffic: { scope: 'CITY', localityId: 'turku-fi' },
    country: 'FI',
    region: 'varsinais-suomi-fi',
    latitude: 60.4518,
    longitude: 22.2666,
  },
  {
    aliases: ['oulu'],
    footTraffic: { scope: 'CITY', localityId: 'oulu-fi' },
    country: 'FI',
    region: 'pohjois-pohjanmaa-fi',
    latitude: 65.0121,
    longitude: 25.4651,
  },
  // Finland — regions and country
  {
    aliases: ['pirkanmaa'],
    footTraffic: { scope: 'REGION', localityId: 'pirkanmaa-fi' },
    country: 'FI',
    region: 'pirkanmaa-fi',
  },
  {
    aliases: ['uusimaa'],
    footTraffic: { scope: 'REGION', localityId: 'uusimaa-fi' },
    country: 'FI',
    region: 'uusimaa-fi',
  },
  {
    aliases: ['suomi', 'finland'],
    footTraffic: { scope: 'COUNTRY', localityId: 'FI' },
    country: 'FI',
  },

  // Finland — notable event venues / anchors with cultural lift
  {
    aliases: ['asuntomessut', 'housing fair'],
    footTraffic: { scope: 'CITY', localityId: 'lempaala-fi' },
    culturalLiftDefault: { scope: 'COUNTRY', localityId: 'FI' },
    country: 'FI',
    region: 'pirkanmaa-fi',
  },
  {
    aliases: ['habitare'],
    footTraffic: { scope: 'CITY', localityId: 'helsinki-fi' },
    culturalLiftDefault: { scope: 'COUNTRY', localityId: 'FI' },
    country: 'FI',
    region: 'uusimaa-fi',
  },
  {
    aliases: ['hullut päivät', 'stockmannin hullut päivät', 'crazy days'],
    footTraffic: { scope: 'COUNTRY', localityId: 'FI' },
    culturalLiftDefault: { scope: 'COUNTRY', localityId: 'FI' },
    country: 'FI',
  },

  // UAE — cities and country (Phase 1 legacy)
  {
    aliases: ['dubai'],
    footTraffic: { scope: 'CITY', localityId: 'dubai-ae' },
    country: 'AE',
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    aliases: ['abu dhabi', 'abudhabi'],
    footTraffic: { scope: 'CITY', localityId: 'abudhabi-ae' },
    country: 'AE',
    latitude: 24.4539,
    longitude: 54.3773,
  },
  {
    aliases: ['united arab emirates', 'uae'],
    footTraffic: { scope: 'COUNTRY', localityId: 'AE' },
    country: 'AE',
  },

  // Germany — city, regions, country
  {
    aliases: ['berlin'],
    footTraffic: { scope: 'CITY', localityId: 'berlin-de' },
    country: 'DE',
    region: 'berlin-de',
    latitude: 52.52,
    longitude: 13.405,
  },
  {
    aliases: ['mitte'],
    footTraffic: { scope: 'CITY', localityId: 'berlin-de' },
    country: 'DE',
    region: 'berlin-de',
  },
  {
    aliases: ['kreuzberg'],
    footTraffic: { scope: 'CITY', localityId: 'berlin-de' },
    country: 'DE',
    region: 'berlin-de',
  },
  {
    aliases: ['charlottenburg'],
    footTraffic: { scope: 'CITY', localityId: 'berlin-de' },
    country: 'DE',
    region: 'berlin-de',
  },
  {
    aliases: ['münchen', 'munich', 'munchen'],
    footTraffic: { scope: 'CITY', localityId: 'munich-de' },
    country: 'DE',
    region: 'bayern-de',
    latitude: 48.1351,
    longitude: 11.582,
  },
  {
    aliases: ['hamburg'],
    footTraffic: { scope: 'CITY', localityId: 'hamburg-de' },
    country: 'DE',
    region: 'hamburg-de',
    latitude: 53.5511,
    longitude: 9.9937,
  },
  {
    aliases: ['deutschland', 'germany'],
    footTraffic: { scope: 'COUNTRY', localityId: 'DE' },
    country: 'DE',
  },

  // Japan — city, regions, country
  {
    aliases: ['tokyo', '東京', 'toukyou'],
    footTraffic: { scope: 'CITY', localityId: 'tokyo-jp' },
    country: 'JP',
    region: 'kanto-jp',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    aliases: ['shibuya', '渋谷'],
    footTraffic: { scope: 'CITY', localityId: 'tokyo-jp' },
    country: 'JP',
    region: 'kanto-jp',
  },
  {
    aliases: ['shinjuku', '新宿'],
    footTraffic: { scope: 'CITY', localityId: 'tokyo-jp' },
    country: 'JP',
    region: 'kanto-jp',
  },
  {
    aliases: ['ginza', '銀座'],
    footTraffic: { scope: 'CITY', localityId: 'tokyo-jp' },
    country: 'JP',
    region: 'kanto-jp',
  },
  {
    aliases: ['yokohama', '横浜'],
    footTraffic: { scope: 'CITY', localityId: 'yokohama-jp' },
    country: 'JP',
    region: 'kanto-jp',
    latitude: 35.4437,
    longitude: 139.638,
  },
  {
    aliases: ['osaka', '大阪'],
    footTraffic: { scope: 'CITY', localityId: 'osaka-jp' },
    country: 'JP',
    region: 'kansai-jp',
    latitude: 34.6937,
    longitude: 135.5023,
  },
  {
    aliases: ['kyoto', '京都'],
    footTraffic: { scope: 'CITY', localityId: 'kyoto-jp' },
    country: 'JP',
    region: 'kansai-jp',
    latitude: 35.0116,
    longitude: 135.7681,
  },
  {
    aliases: ['kanto', '関東'],
    footTraffic: { scope: 'REGION', localityId: 'kanto-jp' },
    country: 'JP',
    region: 'kanto-jp',
  },
  {
    aliases: ['kansai', '関西'],
    footTraffic: { scope: 'REGION', localityId: 'kansai-jp' },
    country: 'JP',
    region: 'kansai-jp',
  },
  {
    aliases: ['japan', 'nihon', 'nippon', '日本'],
    footTraffic: { scope: 'COUNTRY', localityId: 'JP' },
    country: 'JP',
  },

  // United States — city, region, country
  {
    aliases: ['new york', 'nyc', 'new york city'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    aliases: ['manhattan'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['brooklyn'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['soho', 'so-ho'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['hudson yards'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['fifth avenue', '5th avenue'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['times square'],
    footTraffic: { scope: 'CITY', localityId: 'newyork-us' },
    country: 'US',
    region: 'newyork-us',
  },
  {
    aliases: ['united states', 'usa', 'u.s.', 'america'],
    footTraffic: { scope: 'COUNTRY', localityId: 'US' },
    country: 'US',
  },
];

// Build a case-insensitive index keyed by alias.
const aliasIndex = new Map<string, GazetteerEntry>();
for (const entry of entries) {
  for (const alias of entry.aliases) {
    aliasIndex.set(alias.toLowerCase(), entry);
  }
}

/**
 * Look up a gazetteer entry by exact alias match (case-insensitive).
 */
export function findByAlias(term: string): GazetteerEntry | undefined {
  return aliasIndex.get(term.trim().toLowerCase());
}

/**
 * Scan free text for the first gazetteer hit. Longer aliases are preferred
 * so "New York City" wins over "new york". Substring match is intentional:
 * the caller passes the signal title + summary and we want to catch place
 * mentions wherever they occur.
 */
export function findInText(text: string): GazetteerEntry | undefined {
  if (!text) return undefined;
  const haystack = text.toLowerCase();
  let bestEntry: GazetteerEntry | undefined;
  let bestAliasLen = 0;
  for (const [alias, entry] of aliasIndex) {
    if (alias.length <= bestAliasLen) continue;
    if (haystack.includes(alias)) {
      bestEntry = entry;
      bestAliasLen = alias.length;
    }
  }
  return bestEntry;
}

export function listEntries(): readonly GazetteerEntry[] {
  return entries;
}
