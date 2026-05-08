import type { CampaignLang } from './types';

export const CAMPAIGN_LABELS = {
  fi: {
    visitHint: '{{days}} päivän demoarvio, {{tenants}} vuokralaista, lähtötaso 24,0M vuosikävijää',
    salesHint: 'Myyntisignaali perustuu budjettiin, vuokralaisten määrään ja 720M euron demomyyntitasoon',
    tenantHint: '{{selected}} valittu, {{available}} sopivaa ehdokasta',
    draftTitle: 'Sello-kampanjabriiffi',
    draftBody: 'Briiffi yhdistää valinnat, vuokralaiset, kävijäsignaalin ja hyväksyntäpolun live-toteutusta varten.',
    steps: [
      ['Briiffi', 'Kerää kohde, alue, kategoria, kohderyhmä, vuokralaiset ja ShopperMind-tausta.', 'Demo: Sello, valittu alue, tenant mix ja trendin vaikutus.'],
      ['Mallinnus', 'Laskee kävijä- ja myyntisignaalin 24,0M vuosikävijän ja valittujen vuokralaisten perusteella.', 'Demo: budjetti, kesto ja vuokralaismäärä muuttavat KPI-kortteja.'],
      ['Hyväksyntä', 'Valmistaa vuokralais-, budjetti-, kanava- ja johdon hyväksynnät audit trailia varten.', 'Demo: vuokralaislista, kanavat, vastuuroolit ja päätöspisteet.'],
      ['Seuranta', 'Kytkee kampanjan laskureihin, POS-dataan, vuokralaisten osallistumiseen ja kanavatuloksiin.', 'Demo: laskurit, POS, kanavat ja osallistumisdata ovat valmiina liitettäväksi.'],
      ['Opit', 'Tallentaa tuloksen, muokkaukset ja palautteen LLM-koulutusmateriaaliksi.', 'Demo: palaute ja tulokset talteen asiakaskohtaiseen koulutusaineistoon.'],
    ],
  },
  en: {
    visitHint: '{{days}} day demo estimate, {{tenants}} tenants, 24.0M annual visitor baseline',
    salesHint: 'Sales signal uses budget, tenant count and a EUR 720M demo sales baseline',
    tenantHint: '{{selected}} selected, {{available}} matching candidates',
    draftTitle: 'Sello campaign brief',
    draftBody: 'The brief connects selections, tenants, visitor signal and approval path for live execution.',
    steps: [
      ['Brief', 'Collect property, zone, category, audience, tenants and ShopperMind context.', 'Demo: Sello, selected zone, tenant mix and trend impact.'],
      ['Model', 'Estimate visitor and sales signal from the 24.0M annual visitor baseline and tenant mix.', 'Demo: budget, duration and tenant count change the KPI cards.'],
      ['Approval', 'Prepare tenant, budget, channel and management approvals with an audit trail.', 'Demo: tenant list, channels, ownership and decision checkpoints.'],
      ['Live tracking', 'Connect the campaign to counters, POS data, tenant participation and channel results.', 'Demo: counters, POS, channels and participation data are ready to connect.'],
      ['Learning', 'Store result, edits and feedback as LLM training material.', 'Demo: feedback and outcomes are stored in customer-scoped training material.'],
    ],
  },
  sv: {
    visitHint: '{{days}} dagars demoestimat, {{tenants}} hyresgäster, 24,0M årsbesökare som bas',
    salesHint: 'Försäljningssignalen använder budget, hyresgästantal och 720M euro i demoförsäljning',
    tenantHint: '{{selected}} valda, {{available}} matchande kandidater',
    draftTitle: 'Sello-kampanjbrief',
    draftBody: 'Briefen kopplar val, hyresgäster, besökssignal och godkännandeflöde för liveutförande.',
    steps: [
      ['Brief', 'Samla fastighet, zon, kategori, målgrupp, hyresgäster och ShopperMind-kontext.', 'Demo: Sello, vald zon, hyresgästmix och trendpåverkan.'],
      ['Modell', 'Beräkna besöks- och försäljningssignal från 24,0M årsbesökare och hyresgästmix.', 'Demo: budget, längd och antal hyresgäster ändrar KPI-korten.'],
      ['Godkännande', 'Förbered godkännanden för hyresgäster, budget, kanaler och ledning med audit trail.', 'Demo: hyresgästlista, kanaler, ansvar och beslutspunkter.'],
      ['Uppföljning', 'Koppla kampanjen till räknare, POS-data, hyresgästdeltagande och kanalresultat.', 'Demo: räknare, POS, kanaler och deltagardata är redo att anslutas.'],
      ['Lärande', 'Spara resultat, ändringar och feedback som LLM-träningsmaterial.', 'Demo: feedback och resultat sparas i kundavgränsat träningsmaterial.'],
    ],
  },
};

export function lang(value?: string | null): CampaignLang {
  const l = (value ?? 'en').slice(0, 2).toLowerCase();
  return l === 'fi' || l === 'sv' ? l : 'en';
}

export function interpolate(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);
}
