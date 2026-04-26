const CANONICAL_CITIES = [
  'Helsinki',
  'Espoo',
  'Vantaa',
  'Tampere',
  'Lemp\u00e4\u00e4l\u00e4',
  'Turku',
  'Oulu',
  'Jyv\u00e4skyl\u00e4',
  'Lahti',
  'Kuopio',
  'Tokyo',
  'Osaka',
  'Yokohama',
  'New York',
  'Los Angeles',
  'Chicago',
  'Stockholm',
  'Gothenburg',
] as const;

const ALIAS_MAP: Record<string, string> = {
  helsinkin: 'Helsinki',
  helsingin: 'Helsinki',
  espoon: 'Espoo',
  vantaan: 'Vantaa',
  tampereen: 'Tampere',
  'lemp\u00e4\u00e4l\u00e4n': 'Lemp\u00e4\u00e4l\u00e4',
  turun: 'Turku',
  oulun: 'Oulu',
  'jyv\u00e4skyl\u00e4n': 'Jyv\u00e4skyl\u00e4',
  lahden: 'Lahti',
  kuopion: 'Kuopio',
};

export function canonicalCity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const exact = CANONICAL_CITIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  return trimmed;
}
