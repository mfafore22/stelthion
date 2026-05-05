import type { Labels, Metric } from './campaign-brief-response';

export function renderActivationPlan(
  labels: Labels,
  tenants: string,
  metrics?: Record<string, Metric>,
  language?: string,
) {
  if (!/^fi/i.test(language ?? 'fi')) return renderEn(labels, tenants, metrics);
  return [
    `## Lopullinen vuokralaislista\n${tenants}. Listaa voi kaventaa ennen julkaisua sen mukaan, ketkä sitoutuvat kanaviin, tarjouslogiikkaan ja datan jakamiseen.`,
    '## Roolitus\nAnkkurivuokralaiset tuovat välttämättömän asioinnin. Ruoka- ja juomatoimijat muuttavat käynnin helpoksi pysähdykseksi. Täydentävät palvelut lisäävät syyn palata saman kampanjajakson aikana.',
    `## Kampanjaviesti\n"Nappaa arki mukaan Sellosta". Pääviesti: hoida ruoka, nopea pysähdys ja yksi hyödyllinen lisäpalvelu samalla käynnillä ilman erillistä suunnittelua.`,
    '## Kanavasuunnitelma\nPäivät 1-3: omat digipinnat, uutiskirje ja vuokralaisten kanavat. Päivät 4-10: sisäänkäyntien, pysäköinnin ja ravintola-alueen reittinostot. Päivät 11-14: muistutusviestit ja parhaiten toimivien vuokralaisten lisänäkyvyys.',
    '## 14 päivän aikajana\nPäivä 0: hyväksyntä ja materiaalit. Päivät 1-2: pehmeä aloitus. Päivät 3-10: täysi näkyvyys ja päivittäinen seuranta. Päivät 11-14: optimointi havaintojen perusteella. Päivä 15: tuloskooste ja opit.',
    `## KPI-lähtötaso ja tavoite\nKävijäennuste: ${metrics?.visits?.value ?? 'demoarvio'}. Myyntisignaali: ${metrics?.sales?.value ?? 'POS-liitos myöhemmin'}. Vuokralaiset: ${metrics?.tenants?.value ?? '6'}. Demoarviossa tavoite on osoittaa, kasvaako asiointiketju eikä vain yksittäinen alennusosto.`,
    '## Hyväksyntälista\nJohto hyväksyy tavoitteen ja budjetin. Vuokralaiset hyväksyvät roolinsa ja kanavansa. Markkinointi hyväksyy materiaalit. Operointi hyväksyy opasteet ja datatiimi mittauspisteet.',
    '## Live-data checklist\nKävijälaskurit alueittain, POS-signaalit osallistuvilta vuokralaisilta, kampanjalinkkien klikkaukset, vuokralaisten osallistumisaste, opasteiden sijainnit ja poikkeamat kampanjajakson aikana.',
    '## Jälkioppiminen\nTallenna lopullinen briiffi, toteutunut vastaus, KPI-tulos, käyttäjän palaute, vuokralaisten kommentit ja seuraavan kampanjan suositus asiakaskohtaiseen LLM-koulutusaineistoon.',
    '## Seuraava demoaskel\nHyväksy tämä testikampanjaksi ja näytä se Kampanjat-näkymässä luonnoksena, jota voi myöhemmin muokata, jakaa ja liittää live-dataan.',
  ].join('\n\n');
}

function renderEn(labels: Labels, tenants: string, metrics?: Record<string, Metric>) {
  return [
    `## Final Tenant List\n${tenants}. Narrow the list before launch based on tenant commitment to channels, offer logic and data sharing.`,
    '## Roles\nAnchor tenants create the necessary visit. Food operators turn it into an easy stop. Complementary services add a reason to return during the same campaign window.',
    `## Campaign Message\n"Get the weekday done at Sello". The promise: combine grocery, a quick stop and one useful service in one visit.`,
    '## Channel Plan\nDays 1-3: owned screens, newsletter and tenant channels. Days 4-10: route prompts at entrances, parking and dining areas. Days 11-14: reminder messages and extra visibility for best-performing tenants.',
    '## 14-Day Timeline\nDay 0: approval and materials. Days 1-2: soft launch. Days 3-10: full visibility and daily tracking. Days 11-14: optimization from observed behavior. Day 15: results and learning summary.',
    `## KPI Baseline And Target\nVisitor forecast: ${metrics?.visits?.value ?? 'demo estimate'}. Sales signal: ${metrics?.sales?.value ?? 'POS connection later'}. Tenants: ${metrics?.tenants?.value ?? '6'}. The target is to prove a stronger visit chain, not only a discount purchase.`,
    '## Approval Checklist\nManagement approves objective and budget. Tenants approve roles and channels. Marketing approves materials. Operations approves signage and data team approves measurement points.',
    '## Live Data Checklist\nZone counters, tenant POS signals, campaign clicks, tenant participation, signage locations and exceptions during the campaign window.',
    '## Post-Campaign Learning\nStore the final brief, answer, KPI result, user feedback, tenant comments and next campaign recommendation as customer-scoped LLM training material.',
    '## Next Demo Step\nApprove this as a test campaign and show it in Campaigns as a draft that can later be edited, shared and connected to live data.',
  ].join('\n\n');
}
