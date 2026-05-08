import type { AssistantViewContext } from '@/lib/assistant-flow/types';
import type { LLMMessage } from './llm-client';
import { renderActivationPlan } from './campaign-activation-response';

export type Labels = Record<string, string>;
export type Metric = { value?: string; hint?: string };

export function campaignBriefResponse(
  messages: LLMMessage[],
  viewContext: AssistantViewContext | null | undefined,
  language?: string,
): string | null {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const isCampaign = viewContext?.kind === 'campaign_brief' || /kampanjabriiff|campaign brief|kampanjbrief/i.test(last);
  if (!isCampaign) return null;

  const labels = labelsFromContext(viewContext) ?? labelsFromPrompt(last);
  const metrics = viewContext?.kind === 'campaign_brief'
    ? viewContext.payload?.metrics as Record<string, Metric> | undefined
    : undefined;
  const tenants = labels.stores && !/ei valittuja|no tenants|inga/i.test(labels.stores)
    ? labels.stores
    : fallbackTenants(labels.category);

  if (/aktivointisuunnitel|activation plan|aktiveringsplan/i.test(last)) {
    return renderActivationPlan(labels, tenants, metrics, language);
  }
  return renderFi(labels, tenants, metrics, language);
}

function labelsFromContext(viewContext: AssistantViewContext | null | undefined): Labels | null {
  if (viewContext?.kind !== 'campaign_brief') return null;
  return (viewContext.payload?.labels as Labels | undefined) ?? null;
}

function labelsFromPrompt(prompt: string): Labels {
  return {
    mall: pick(prompt, /kohde\s+([^,]+)/i) ?? 'Sello',
    zone: pick(prompt, /alue\s+([^,]+)/i) ?? 'Päivittäisasiointi',
    audience: pick(prompt, /kohderyhmä\s+([^,]+)/i) ?? 'Arjen asioijat',
    category: pick(prompt, /kategoria\s+([^,]+)/i) ?? 'Ruoka ja juoma',
    stores: pick(prompt, /ehdotetut vuokralaiset\s+([^,]+)/i) ?? 'Ei valittuja vuokralaisia',
    budget: pick(prompt, /budjetti\s+([^,]+)/i) ?? 'Perus',
    duration: pick(prompt, /kesto\s+([^,.]+)/i) ?? '14 päivää',
  };
}

function pick(text: string, pattern: RegExp) {
  return pattern.exec(text)?.[1]?.trim();
}

function fallbackTenants(category?: string) {
  if (/ruoka|food|juoma/i.test(category ?? '')) {
    return 'Prisma, K-Citymarket, Alko, Fazer Café, Arnolds ja Jungle Juice Bar';
  }
  if (/hyvinvointi|beauty|kauneus|terveys/i.test(category ?? '')) {
    return 'Sanitum Apteekki Sello, Pihlajalinna, KICKS, Lyko, Rituals ja Elixia';
  }
  return 'valitut vuokralaiset, jotka tukevat samaa käyntisyyketjua';
}

function renderFi(labels: Labels, tenants: string, metrics?: Record<string, Metric>, language?: string) {
  if (!/^fi/i.test(language ?? 'fi')) return renderEn(labels, tenants, metrics);
  return [
    `## Tavoite\nLisätä ${labels.mall ?? 'Sello'}-kohteen ${labels.zone ?? 'päivittäisasioinnin'} käyntitiheyttä 14 päivän testillä ja kasvattaa arjen asioijalle syitä hoitaa useampi tarve samalla käynnillä.`,
    `## Asiakastarve\n${labels.audience ?? 'Arjen asioijat'} hakevat nopeaa, matalariskistä ja hyödyllistä asiointia. Ruoka ja juoma toimii tässä käyntisyyketjun ankkurina, mutta kampanjan pitää ohjata myös täydentäviin palveluihin eikä jäädä pelkäksi tarjoukseksi.`,
    `## Kampanjaidea\n"Nappaa arki mukaan Sellosta": reitti, jossa asiakas voi yhdistää ruokakaupan, nopean lounaan tai välipalan ja yhden täydentävän palvelun. Viestintä painottaa ajan säästöä, helppoutta ja arjen kokonaisratkaisua.`,
    `## Vuokralaisten roolit\n${tenants}. Ruokakaupat tuovat välttämättömän asioinnin, kahvilat ja nopea ruoka lisäävät lyhyen pysähdyksen syyn, ja täydentävät palvelut tekevät käynnistä hyödyllisemmän.`,
    '## Kanavat\nSellon omat digipinnat, uutiskirje, sosiaalinen media, sisäänkäyntien ja pysäköinnin opasteet, vuokralaisten omat kanavat sekä paikan päällä näkyvät reittinostot.',
    `## KPI:t\nKävijäennuste: ${metrics?.visits?.value ?? 'demoarvio'} (${metrics?.visits?.hint ?? '14 päivän kampanjajakso'}). Myyntisignaali: ${metrics?.sales?.value ?? 'POS-liitos myöhemmin'}. Vuokralaiset: ${metrics?.tenants?.value ?? '6'} (${metrics?.tenants?.hint ?? 'siemendatan perusteella ehdotettu osallistujamäärä'}).`,
    '## Hyväksyntäaskeleet\nVarmista vuokralaisten osallistuminen, kanavakohtainen näkyvyys, kampanjan vastuuhenkilö, budjetti ja mittausmalli ennen julkaisua.',
    '## Live-dataan liitettävät tiedot\nKävijälaskurit alueittain, POS-signaalit osallistuvilta vuokralaisilta, kampanjalinkkien klikkaukset, vuokralaisten osallistumisdata ja kampanjan jälkipalaute LLM-koulutusaineistoon.',
  ].join('\n\n');
}

function renderEn(labels: Labels, tenants: string, metrics?: Record<string, Metric>) {
  return [
    `## Objective\nIncrease ${labels.mall ?? 'Sello'} everyday-errand visit frequency with a 14-day test.`,
    `## Customer Need\n${labels.audience ?? 'Daily visitors'} need a fast, useful and low-risk reason to combine several errands in one visit.`,
    `## Campaign Concept\n"Get the weekday done at Sello": connect grocery, quick food and one useful add-on service into a clear visit route.`,
    `## Tenant Roles\n${tenants}. Anchor tenants create the necessary visit, food operators add an easy stop, and services make the trip more useful.`,
    '## Channels\nOwned digital surfaces, newsletter, social media, entrance and parking signage, tenant channels and in-centre route prompts.',
    `## KPIs\nVisitor forecast: ${metrics?.visits?.value ?? 'demo estimate'}. Sales signal: ${metrics?.sales?.value ?? 'POS connection later'}. Tenants: ${metrics?.tenants?.value ?? '6'}.`,
    '## Approval Steps\nConfirm tenant participation, channel visibility, owner, budget and measurement model before launch.',
    '## Live Data To Connect\nZone counters, tenant POS signals, campaign clicks, tenant participation and post-campaign feedback for LLM training.',
  ].join('\n\n');
}
