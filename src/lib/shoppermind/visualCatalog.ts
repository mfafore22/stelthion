import type { BannerVisual } from '@/components/mall/visuals/VisualBanner';

export type TaggedVisual = { src: BannerVisual; tags: string[] };
const trend = (title: string, primary: string, secondary: string, accent: string) => ({ title, primary, secondary, accent });

export const TREND_VISUALS: TaggedVisual[] = [
  { src: trend('GLP-1 basket shift', '#256f5b', '#9bcf8a', '#214990'), tags: ['ozempic', 'glp-1', 'glp1', 'weight-loss', 'painonhallinta', 'laihdutus'] },
  { src: trend('Digital grocery', '#1f4f8f', '#5eb8a8', '#f3c978'), tags: ['web grocery', 'e-commerce grocery', 'online grocery', 'q-commerce', 'pikatoimit', 'verkkoruoka', 'ruokaverkko'] },
  { src: trend('Physical return', '#db4c64', '#f0c24c', '#2fa866'), tags: ['gen z', 'z generation', 'z-generation', 'zoomer', 'young adult', 'nuoret aikuiset', 'nuoret'] },
  { src: trend('Challenger brands', '#7b36bf', '#f7966b', '#214990'), tags: ['challenger brand', 'indie brand', 'direct-to-consumer', 'dtc', 'emerging brand', 'uusi brändi'] },
  { src: trend('AI shopping', '#214990', '#7c91d5', '#328d2e'), tags: ['ai shopping', 'shopping ai', 'ai assistant', 'generative ai', 'tekoälyostos', 'tekoälyavuste', 'copilot'] },
  { src: trend('Experience-led retail', '#8a4c3a', '#f3c978', '#214990'), tags: ['experiential', 'experience-led', 'immersive', 'flagship', 'entertainment', 'elämys', 'kokemus', 'upplevelse'] },
  { src: trend('Proximity stores', '#2f7d5d', '#b4d67c', '#19311d'), tags: ['proximity', 'neighbourhood', 'neighborhood', 'hyperlocal', 'near-home', 'lähikauppa', 'lähellä', 'närhandel'] },
  { src: trend('Transit flow', '#1f70b7', '#53b1e5', '#328d2e'), tags: ['station', 'transit', 'commut', 'metro', 'train', 'mobility', 'pasila', 'asema', 'liikenne', 'pendl'] },
  { src: trend('Omnichannel', '#214990', '#328d2e', '#f3c978'), tags: ['omnichannel', 'digital', 'frictionless', 'app', 'loyalty', 'retail media', 'media', 'click', 'collect', 'verkko', 'digitaal', 'data'] },
  { src: trend('Grocery frequency', '#328d2e', '#7cb928', '#214990'), tags: ['grocery', 'supermarket', 'daily', 'essentials', 'convenience', 'basket', 'päivittäi', 'arjen', 'dagligvar', 'vardag'] },
  { src: trend('Health and wellness', '#0f766e', '#9bd2c7', '#214990'), tags: ['health', 'wellness', 'pharmacy', 'clinic', 'care', 'terveys', 'hyvinvointi', 'apteek', 'hälsa', 'vård'] },
  { src: trend('Food and dining', '#b45309', '#f3c978', '#328d2e'), tags: ['food', 'dining', 'restaurant', 'lunch', 'cafe', 'kahvi', 'ravint', 'ruoka', 'mat', 'server'] },
  { src: trend('Family missions', '#f27023', '#f6c04e', '#214990'), tags: ['family', 'kids', 'children', 'play', 'event', 'community', 'perhe', 'lapset', 'harrastus', 'tapahtuma', 'familj', 'barn'] },
  { src: trend('Premium destination', '#1f3d74', '#f3c978', '#4567a6'), tags: ['premium', 'luxury', 'destination', 'tourism', 'hospitality', 'travel', 'visitor', 'kohdekäynti', 'matkail'] },
  { src: trend('Smart value', '#566542', '#d2ad82', '#214990'), tags: ['value', 'price', 'discount', 'budget', 'saving', 'edull', 'tarjous', 'pris', 'låg risk', 'low-risk'] },
  { src: trend('Consumer shift', '#214990', '#328d2e', '#f7966b'), tags: ['consumer', 'retail', 'shopping', 'mall', 'kauppa', 'kuluttaja'] },
];

export const SECTION_VISUALS: Record<string, BannerVisual> = {
  overview: trend('Päänäkymä', '#214990', '#328d2e', '#f3c978'),
  actions: trend('Toimenpiteet', '#328d2e', '#f7966b', '#214990'),
  competitors: trend('Kilpailijat', '#1f3d74', '#8f9a77', '#f3c978'),
  decision: trend('Päätöksen tuki', '#214990', '#7c91d5', '#328d2e'),
  'signal-market': trend('Kuukauden signaali', '#b45309', '#f3c978', '#214990'),
  'signal-premium': trend('Kuukauden signaali', '#1f3d74', '#f3c978', '#4567a6'),
  'path-neutral': trend('Polku A', '#6f7688', '#c9c7c1', '#214990'),
  'path-dark': trend('Polku B', '#7f1d1d', '#f04e54', '#1f2937'),
  'path-bright': trend('Polku C', '#328d2e', '#7cb928', '#f3c978'),
};

export const ASSISTANT_VISUALS: Record<string, BannerVisual> = {
  overview: trend('Suljettu assistenttiympäristö', '#214990', '#328d2e', '#f3c978'),
  'owner-copilot': trend('Owner assistant', '#214990', '#328d2e', '#f3c978'),
  'trend-analyst': trend('Trend analyst', '#0f766e', '#14b8a6', '#214990'),
  'campaign-designer': trend('Campaign designer', '#b45309', '#f3c978', '#214990'),
  'space-optimizer': trend('Space optimizer', '#6d28d9', '#a78bfa', '#328d2e'),
};
