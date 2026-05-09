import type { CampaignIdeaInput, CampaignIdeaLanguage } from './campaign-ideas.js';

export interface FallbackContent {
  angle: string;
  audience: string;
  channels: string[];
  hook: string;
  cta: string;
  successMetric: string;
  whyNow: string;
  rationale: string;
}

const STATE_FI: Record<string, string> = {
  EMERGING: 'nouseva',
  ACCELERATING: 'kiihtyvä',
  STABLE: 'vakaa',
  FADING: 'hiipuva',
  DORMANT: 'lepotilassa',
};

const STATE_SV: Record<string, string> = {
  EMERGING: 'framväxande',
  ACCELERATING: 'accelererande',
  STABLE: 'stabil',
  FADING: 'avtagande',
  DORMANT: 'vilande',
};

export function stateLabel(state: string, lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return STATE_FI[state] ?? state.toLowerCase();
  if (lang === 'sv') return STATE_SV[state] ?? state.toLowerCase();
  return state.toLowerCase();
}

export function normalizeCampaignHook(
  value: unknown,
  input: CampaignIdeaInput,
  lang: CampaignIdeaLanguage,
): string {
  const text = typeof value === 'string' ? clean(value) : '';
  return repetitiveHook(text, input) ? fallbackHook(input, lang) : text || fallbackHook(input, lang);
}

export function fallback(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): FallbackContent {
  return {
    angle: angle(input, lang),
    audience: audience(input, lang),
    channels: channels(lang),
    hook: fallbackHook(input, lang),
    cta: cta(lang),
    successMetric: successMetric(lang),
    whyNow: whyNow(input, lang),
    rationale: rationale(input, lang),
  };
}

function fallbackHook(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): string {
  const category = input.categories[0] ?? input.keywords[0] ?? input.industryFocus ?? 'visit';
  const templates = hookTemplates(input.label, category, lang);
  const seed = Math.abs([...input.phenomenonId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0));
  return templates[seed % templates.length]!;
}

function hookTemplates(label: string, category: string, lang: CampaignIdeaLanguage): string[] {
  if (lang === 'fi') return [
    `Tee ${label}-tarpeesta viikon käyntisyy.`,
    `Yksi reitti, monta syytä tulla.`,
    `Testaa ${category}-kysyntä ennen kilpailijaa.`,
    `Muuta kiinnostus mitattavaksi käynniksi.`,
  ];
  if (lang === 'sv') return [
    `Gör ${label} till veckans besöksorsak.`,
    `En rutt, flera skäl att komma.`,
    `Testa efterfrågan inom ${category} före konkurrenterna.`,
    `Gör intresse till mätbara besök.`,
  ];
  return [
    `Turn ${label} into this week's visit reason.`,
    `One route, several reasons to show up.`,
    `Test ${category} demand before competitors do.`,
    `Turn interest into measurable visits.`,
  ];
}

function repetitiveHook(text: string, input: CampaignIdeaInput): boolean {
  const lower = text.toLowerCase();
  const label = input.label.toLowerCase();
  return lower.includes(label) && /\b(now|nyt|nu)\b/.test(lower) &&
    lower.includes(input.marketDisplay.toLowerCase());
}

function angle(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return `${input.label} kannattaa kytkeä konkreettiseen asiointireittiin, ei pelkkään trendiviestiin.`;
  if (lang === 'sv') return `${input.label} bör kopplas till en konkret besöksrutt, inte bara ett trendbudskap.`;
  return `${input.label} should become a concrete visit route, not just a trend message.`;
}

function audience(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return `Asiakkaat, joilla trendi näkyy jo arjen valinnoissa ja asiointirytmissä.`;
  if (lang === 'sv') return `Kunder där trenden redan syns i vardagsval och besöksrytm.`;
  return `Customers already showing the trend in everyday choices and visit rhythm.`;
}

function channels(lang: CampaignIdeaLanguage): string[] {
  if (lang === 'fi') return ['Omat kanavat', 'Vuokralaismedia', 'Paikallinen kohdennus'];
  if (lang === 'sv') return ['Egna kanaler', 'Hyresgästmedia', 'Lokal målgruppsstyrning'];
  return ['Owned channels', 'Tenant media', 'Local targeting'];
}

function cta(lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return 'Valitse reitti ja käy viikon aikana.';
  if (lang === 'sv') return 'Välj rutten och besök under veckan.';
  return 'Pick the route and visit this week.';
}

function successMetric(lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return 'Kohderyhmän käynnit +10 % kampanjajakson aikana.';
  if (lang === 'sv') return 'Besök i målgruppen +10 % under kampanjperioden.';
  return 'Target-audience visits +10% during the campaign window.';
}

function whyNow(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): string {
  const state = stateLabel(input.state, lang);
  if (lang === 'fi') return `Signaali on ${state}, joten ajoitus kannattaa testata nyt rajatulla kohderyhmällä.`;
  if (lang === 'sv') return `Signalen är ${state}, så tajmingen bör testas nu med en avgränsad målgrupp.`;
  return `The signal is ${state}, so timing should be tested now with a focused audience.`;
}

function rationale(input: CampaignIdeaInput, lang: CampaignIdeaLanguage): string {
  if (lang === 'fi') return `Idea yhdistää kysynnän, vuokralaisroolit ja mitattavan käynnin ilman raskasta tuotantoa.`;
  if (lang === 'sv') return `Idén kopplar efterfrågan, hyresgästens roll och mätbara besök utan tung produktion.`;
  return `The idea links demand, tenant roles and measurable visits without heavy production.`;
}

function clean(value: string): string {
  return value.replace(/\u2014/g, '-').trim();
}
