import type { PropertyActionsResponse } from '@stelthion/shoppermind-client-types';

type ActionType = PropertyActionsResponse['recommendations'][number]['actionType'];
type Kpi = { label: string; target?: string; hint?: string };

const TREND_MATCHERS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'smart-value-low-risk', pattern: /arjen|päivittäis|ruoka|grocery|value|edull|välttämät|low-risk|energia|energy/i },
  { id: 'frictionless-omnichannel', pattern: /nouto|verkkotilaus|returns?|pickup|app|sovellus|loyalty|kanta-asiakas|mobile/i },
  { id: 'curated-discretionary', pattern: /tapahtuma|fani|popkult|vapaa|leisure|fashion|erikoiskauppa|premium|curated/i },
  { id: 'circular-commerce', pattern: /kierto|käytetty|korjaus|repair|resale|trade-in|recycling|vuokraus/i },
  { id: 'service-led-ageing', pattern: /senior|ikäänt|65|esteettö|accessib|palvelu|service|family|perhe/i },
  { id: 'retail-media-and-mall-attention', pattern: /media|näyttö|screen|kampanja|campaign|huomio|audience/i },
  { id: 'health-beauty-wellness-frequency', pattern: /terveys|hyvinvointi|wellness|apteek|kauneus|beauty|fitness|care/i },
  { id: 'uae-hormuz-risk-premium', pattern: /hormuz|iran|insurance|shipping|logistics|vakuutus/i },
  { id: 'uae-opec-autonomy-retail', pattern: /opec|oil|energy|financing|rahoitus|energia/i },
  { id: 'uae-safe-hub-tourism', pattern: /touris|turis|airport|hotel|safe|turva|premium booking/i },
];

export function actionTitleFromText(text: string): string {
  const headline = text.split(/[:.!?]/)[0]?.trim() || text.trim();
  if (headline.length <= 58) return headline;
  return truncateAtWord(headline, 58);
}

export function actionWhyNowFromText(text: string, context: string, kpi?: Kpi): string {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
  const explicitReason = sentences.slice(1).find((part) => part.length > 24);
  const colonReason = text.includes(':') ? text.split(':').slice(1).join(':').split(/[.!?]/)[0]?.trim() : '';
  const contextReason = context.split(/[.!?]/)[0]?.trim() || context.trim();
  const reason = explicitReason || colonReason || contextReason;
  const kpiTarget = kpi?.target ? `${kpi.label}: ${kpi.target}` : kpi?.label;
  return kpiTarget ? `${trimTerminal(reason)} (${kpiTarget}).` : reason;
}

export function relatedTrendIdsForAction(text: string, trendIds: string[], index: number): string[] {
  if (trendIds.length === 0) return ['smart-value-low-risk'];
  const available = new Set(trendIds);
  const matches = TREND_MATCHERS
    .filter((matcher) => available.has(matcher.id) && matcher.pattern.test(text))
    .map((matcher) => matcher.id);
  return unique([...matches, trendIds[index % trendIds.length]]).slice(0, 3);
}

export function actionTypeForAction(text: string, index: number): ActionType {
  if (/media|screen|näyttö|huomio|audience/i.test(text)) return 'retail_media';
  if (/vuokra|tenant|mix|pinta-ala|ankkuri|erikoiskauppa|väliaikais|pop-up/i.test(text)) return 'tenant_mix';
  if (/mittaa|nps|benchmark|vertail|leed|sertif|kpi|indeksi/i.test(text)) return 'benchmark';
  if (/kampanja|campaign|tapahtuma|event|fani|popkult/i.test(text)) return 'campaign';
  return (['operations', 'campaign', 'tenant_mix', 'benchmark', 'retail_media'] as const)[index % 5];
}

export function zoneTagsFromText(text: string): string[] {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();
  if (/ruoka|food|ravintola|restaurant|kahvila|cafe|grocery|päivittäis/.test(normalized)) tags.add('food');
  if (/terveys|health|beauty|kauneus|wellness|apteek/.test(normalized)) tags.add('health');
  if (/screen|media|kampanja|campaign|app|loyalty|näyttö/.test(normalized)) tags.add('campaign');
  if (/palvelu|service|repair|korjaus/.test(normalized)) tags.add('services');
  if (/family|perhe|leisure|vapaa/.test(normalized)) tags.add('leisure');
  if (tags.size === 0) tags.add('mall-wide');
  return Array.from(tags);
}

function truncateAtWord(text: string, maxLength: number): string {
  const clipped = text.slice(0, maxLength - 3);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 28 ? lastSpace : clipped.length).trim()}...`;
}

function trimTerminal(text: string): string {
  return text.replace(/[.!?]\s*$/, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
