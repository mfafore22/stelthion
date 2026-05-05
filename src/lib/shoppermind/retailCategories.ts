export type RetailCategoryState = 'present' | 'absent_relevant';
export type RetailImpactDirection = 'positive' | 'negative' | 'mixed' | 'watch';
export type RetailImpactIntensity = 'low' | 'medium' | 'high';
export type RetailCategoryId =
  | 'grocery-daily' | 'food-beverage' | 'fashion-apparel' | 'shoes-accessories'
  | 'beauty-health' | 'sports-outdoor' | 'home-furniture' | 'electronics'
  | 'books-toys-hobby' | 'department-general' | 'entertainment-experiences'
  | 'fitness-wellness-medical' | 'services' | 'mobility-automotive'
  | 'popups-activations' | 'luxury-premium' | 'value-discount' | 'specialty';

export interface RetailCategoryImpact { id: RetailCategoryId; state: RetailCategoryState; direction: RetailImpactDirection; intensity: RetailImpactIntensity }

type Lang = 'fi' | 'en' | 'sv';

const LABELS: Record<RetailCategoryId, Record<Lang, string>> = {
  'grocery-daily': { fi: 'Päivittäistavara', en: 'Grocery and daily essentials', sv: 'Dagligvaror' },
  'food-beverage': { fi: 'Ruoka ja juoma', en: 'Food and beverage', sv: 'Mat och dryck' },
  'fashion-apparel': { fi: 'Muoti ja vaatetus', en: 'Fashion and apparel', sv: 'Mode och kläder' },
  'shoes-accessories': { fi: 'Kengät ja asusteet', en: 'Shoes and accessories', sv: 'Skor och accessoarer' },
  'beauty-health': { fi: 'Kauneus ja terveys', en: 'Beauty and health', sv: 'Skönhet och hälsa' },
  'sports-outdoor': { fi: 'Urheilu ja outdoor', en: 'Sports and outdoor', sv: 'Sport och outdoor' },
  'home-furniture': { fi: 'Koti ja kalusteet', en: 'Home and furniture', sv: 'Hem och möbler' },
  electronics: { fi: 'Elektroniikka', en: 'Electronics', sv: 'Elektronik' },
  'books-toys-hobby': { fi: 'Kirjat, lelut ja harrasteet', en: 'Books, toys and hobby', sv: 'Böcker, leksaker och hobby' },
  'department-general': { fi: 'Tavaratalo ja yleistavara', en: 'Department and general merchandise', sv: 'Varuhus och allmänvaror' },
  'entertainment-experiences': { fi: 'Viihde ja elämykset', en: 'Entertainment and experiences', sv: 'Nöje och upplevelser' },
  'fitness-wellness-medical': { fi: 'Hyvinvointi ja terveyspalvelut', en: 'Fitness, wellness and medical', sv: 'Träning, välmående och vård' },
  services: { fi: 'Palvelut', en: 'Services', sv: 'Tjänster' },
  'mobility-automotive': { fi: 'Liikkuminen ja autoilu', en: 'Mobility and automotive', sv: 'Mobilitet och bil' },
  'popups-activations': { fi: 'Pop-upit ja aktivoinnit', en: 'Pop-ups and activations', sv: 'Pop-up och aktiveringar' },
  'luxury-premium': { fi: 'Premium ja luksus', en: 'Premium and luxury', sv: 'Premium och lyx' },
  'value-discount': { fi: 'Arvo ja alennus', en: 'Value and discount', sv: 'Värde och rabatt' },
  specialty: { fi: 'Erikoiskauppa', en: 'Specialty retail', sv: 'Specialhandel' },
};

const KEYWORDS: Record<RetailCategoryId, string[]> = {
  'grocery-daily': ['grocery', 'daily', 'päivittäis', 'ruokakauppa', 'matbutik', 'daglig'],
  'food-beverage': ['food', 'restaurant', 'cafe', 'ruoka', 'ravintola', 'kahvila', 'mat', 'restaurang'],
  'fashion-apparel': ['fashion', 'apparel', 'clothing', 'muoti', 'vaate', 'mode', 'kläder'],
  'shoes-accessories': ['shoe', 'accessor', 'kenkä', 'asuste', 'skor', 'accessoar'],
  'beauty-health': ['beauty', 'health', 'kauneus', 'terveys', 'skönhet', 'hälsa'],
  'sports-outdoor': ['sport', 'outdoor', 'leisure', 'urheilu', 'vapaa-aika', 'fritid'],
  'home-furniture': ['home', 'furniture', 'renovation', 'koti', 'kaluste', 'remont', 'hem', 'möbel'],
  electronics: ['electronics', 'telecom', 'appliance', 'elektroniikka', 'kodinkone', 'teknik'],
  'books-toys-hobby': ['book', 'toy', 'hobby', 'kirja', 'lelu', 'harraste', 'bok', 'leksak'],
  'department-general': ['department', 'general merchandise', 'tavaratalo', 'yleistavara', 'varuhus'],
  'entertainment-experiences': ['experience', 'entertainment', 'event', 'elämys', 'viihde', 'tapahtuma', 'upplevelse'],
  'fitness-wellness-medical': ['fitness', 'wellness', 'medical', 'hyvinvointi', 'lääkäri', 'vård', 'välmående'],
  services: ['service', 'repair', 'financial', 'palvelu', 'korjaus', 'finans', 'tjänst'],
  'mobility-automotive': ['mobility', 'automotive', 'car', 'auto', 'liikkuminen', 'bil'],
  'popups-activations': ['pop-up', 'activation', 'campaign', 'aktivointi', 'kampanja'],
  'luxury-premium': ['premium', 'luxury', 'hemmottelu', 'luksus', 'lyx'],
  'value-discount': ['value', 'discount', 'budget', 'arvo', 'alennus', 'budjetti', 'rabatt'],
  specialty: ['specialty', 'curated', 'erikois', 'kuratoitu', 'special'],
};

const IDENTITY_RULES: Array<{ ids: RetailCategoryId[]; patterns: string[] }> = [
  { ids: ['beauty-health', 'fitness-wellness-medical'], patterns: ['health-beauty-wellness-frequency', 'beauty and wellness', 'kauneus ja terveys', 'terveys', 'kauneus', 'hyvinvointi', 'hälsa', 'skönhet', 'välmående', 'wellness'] },
  { ids: ['services', 'fashion-apparel', 'home-furniture', 'electronics'], patterns: ['circular-commerce', 'circular commerce', 'product-life', 'kiertokauppa', 'kiertotalous', 'kierrätys', 'sustainability', 'hållbarhet', 'cirkulär handel'] },
  { ids: ['value-discount', 'department-general'], patterns: ['smart-value-low-risk', 'smart value', 'private label', 'value polarization', 'low-risk spending'] },
  { ids: ['sports-outdoor'], patterns: ['nordic outdoor', 'outdoor culture', 'outdoor leisure', 'friluftsliv', 'ulkoilu'] },
  { ids: ['food-beverage'], patterns: ['food and dining', 'food-led', 'fine dining'] },
  { ids: ['food-beverage', 'grocery-daily'], patterns: ['convenience food', 'take-away', 'takeaway', 'fast food', 'quick food'] },
  { ids: ['grocery-daily'], patterns: ['grocery-frequency', 'daily essentials', 'päivittäistavara', 'dagligvar'] },
  { ids: ['services', 'fitness-wellness-medical'], patterns: ['service-led-ageing', 'ageing', 'aging', 'accessibility'] },
  { ids: ['fashion-apparel', 'beauty-health', 'home-furniture'], patterns: ['curated-discretionary'] },
];

export function categoryLabel(id: RetailCategoryId, lang: string): string {
  const l = lang.slice(0, 2) as Lang;
  return LABELS[id][l === 'fi' || l === 'sv' ? l : 'en'];
}

export function inferRetailCategoryImpacts(text: string, present: RetailCategoryId[] = []): RetailCategoryImpact[] {
  const hay = text.toLowerCase();
  const presentSet = new Set(present);
  const identity = hay.split('|').slice(0, 3).join(' ');
  const direct = IDENTITY_RULES.find((rule) => rule.patterns.some((pattern) => identity.includes(pattern)));
  if (direct) {
    return direct.ids.map((id) => ({
      id,
      state: presentSet.has(id) ? 'present' : 'absent_relevant',
      direction: 'positive',
      intensity: 'high',
    }));
  }
  const scored = Object.entries(KEYWORDS).flatMap(([id, words]) => {
    const hits = words.filter((w) => hay.includes(w)).length;
    if (!hits) return [];
    const direction = /risk|pressure|heikko|riski|paine|svag|risk/.test(hay) ? 'mixed' : 'positive';
    const intensity = hits >= 3 ? 'high' : hits === 2 ? 'medium' : 'low';
    return [{ id: id as RetailCategoryId, state: presentSet.has(id as RetailCategoryId) ? 'present' : 'absent_relevant', direction, intensity, hits }];
  });
  return scored.sort((a, b) => b.hits - a.hits).slice(0, 6)
    .map((item) => ({ id: item.id, state: item.state, direction: item.direction, intensity: item.intensity }));
}
