import { SELLO_TENANTS, type SelloTenant } from '@/lib/data/selloTenantMix';
import { TRIPLA_TENANTS, type TriplaTenant } from '@/lib/data/triplaTenantMix';

type Tenant = SelloTenant | TriplaTenant;

// Maps the abstract categoryIds used in TEMPLATES to the concrete `category`
// strings stored on each tenant record. Lets the same template select
// tenants from any mall's pool by category rather than by hardcoded name.
const CATEGORY_ID_TO_TENANT_CATEGORY: Record<string, string[]> = {
  'food-beverage': ['Food & Beverage'],
  'grocery-daily': ['Daily Goods & Grocery'],
  'beauty-health': ['Beauty & Health'],
  'fitness-wellness-medical': ['Beauty & Health'],
  'fashion-apparel': ['Fashion'],
  'home-furniture': ['Home & Living'],
  'electronics': ['Home & Living'],
  'services': ['Services'],
  'entertainment-experiences': ['Leisure'],
  'books-toys-hobby': ['Leisure', 'Home & Living'],
};

function pickByCategory(pool: Tenant[], categoryIds: string[], limit = 6): Tenant[] {
  const categories = new Set(categoryIds.flatMap((id) => CATEGORY_ID_TO_TENANT_CATEGORY[id] ?? []));
  return pool.filter((tenant) => categories.has(tenant.category)).slice(0, limit);
}

type Lang = 'fi' | 'en' | 'sv';
type Move = 'increase' | 'reposition' | 'reduce' | 'test' | 'recruit';
type Horizon = 'short' | 'medium' | 'long';

export interface TenantImpactStore {
  name: string;
  category: string;
  floor: string;
  location: string;
  categoryIds?: string[];
  insightIds?: string[];
}

export interface TenantImpactInsight {
  id: string;
  title: string;
  need: string;
  recommendation: string;
  focus: string;
  reduce: string;
  campaignAngle: string;
  horizon: Horizon;
  move: Move;
  categoryIds: string[];
  stores: TenantImpactStore[];
  liveInputs: string[];
}

interface Template {
  id: string;
  horizon: Horizon;
  move: Move;
  categoryIds: string[];
  stores: string[];
  text: Record<Lang, Pick<TenantImpactInsight, 'title' | 'need' | 'recommendation' | 'focus' | 'reduce' | 'campaignAngle'>>;
}

const TEMPLATES: Template[] = [
  {
    id: 'food-density-daypart',
    horizon: 'short',
    move: 'reposition',
    categoryIds: ['food-beverage', 'grocery-daily', 'fitness-wellness-medical'],
    stores: ['iPoke', 'Jungle Juice Bar', 'Fazer Café', 'Classic Pizza', 'Prisma', 'Elixia'],
    text: {
      fi: {
        title: 'Ruokatarjonta tarvitsee tarkempia asiointitilanteita',
        need: 'Hintatietoisuus, hyvinvointi ja työpäivän rytmi jakavat ruokakysyntää selkeisiin käyttötarpeisiin.',
        recommendation: 'Jäsennä ravintolatarjonta tilanteittain: nopea proteiinilounas, kevyt välipala, perheen ilta ja viikonlopun elämys.',
        focus: 'Korosta annos- ja valikoimaratkaisuja, jotka tekevät terveellisemmästä tai edullisemmasta valinnasta helpon.',
        reduce: 'Älä lisää yleistä pikaruokakapasiteettia ilman selkeää roolia tai erottuvaa käyntisyytä.',
        campaignAngle: 'Rakenna lounas- ja iltareittejä, joissa sama trendi palvelee eri kellonaikoja.',
      },
      en: {
        title: 'Food needs sharper missions, not simply more volume',
        need: 'Value seeking, weight management and workday routines split food demand into smaller visit missions.',
        recommendation: 'Treat the large restaurant base as a daypart and mission mix: fast protein lunch, light snack, family evening and weekend experience.',
        focus: 'Prioritise range and portion angles that lower purchase risk and make the healthier choice easy.',
        reduce: 'Avoid adding generic fast-food capacity without a distinct mission or visit reason.',
        campaignAngle: 'Build lunch and evening routes where the same trend serves different dayparts.',
      },
      sv: {
        title: 'Mat behöver tydligare köptillfällen, inte bara mer volym',
        need: 'Värdesökande, viktkontroll och arbetsdagens rytm delar matefterfrågan i mindre besöksuppdrag.',
        recommendation: 'Behandla restaurangbasen som en mix av dagdelar och uppdrag: snabb proteinlunch, lätt mellanmål, familjekväll och helgupplevelse.',
        focus: 'Lyft sortiment och portionsvinklar som minskar köprisken och gör det hälsosammare valet enkelt.',
        reduce: 'Undvik mer generisk snabbmatskapacitet utan tydlig roll eller besöksorsak.',
        campaignAngle: 'Bygg lunch- och kvällsrutter där samma trend tjänar olika dagdelar.',
      },
    },
  },
  {
    id: 'wellness-errand-loop',
    horizon: 'medium',
    move: 'increase',
    categoryIds: ['beauty-health', 'services', 'fitness-wellness-medical'],
    stores: ['KICKS', 'Lyko', 'Rituals', 'Sanitum Apteekki Sello', 'Pihlajalinna', 'Elixia'],
    text: {
      fi: {
        title: 'Hyvinvointi toimii arjen asiointireittinä',
        need: 'Asiakas haluaa hoitaa hyvinvointia hallitusti, ilman erillistä ja raskasta ostoskäyntiä.',
        recommendation: 'Kytke apteekki, terveyspalvelut, kauneus ja liikunta ajanvarauksiin sekä arjen asiointiin.',
        focus: 'Kasvata toistuvia hoito-, täydennys- ja jäsenyyskäyntejä, joissa lyhyt käynti riittää.',
        reduce: 'Vähennä irrallisia kauneuskampanjoita, jos ne eivät liity palveluun, terveyteen tai arjen rytmiin.',
        campaignAngle: 'Tee viikon hyvinvointireitti: varaus, täydennysostos ja lyhyt palauttava palvelu.',
      },
      en: {
        title: 'Wellness works best as an errand loop',
        need: 'Consumers want controlled self-care without turning it into a heavy shopping trip.',
        recommendation: 'Connect pharmacy, health services, beauty and fitness to appointments and everyday errands.',
        focus: 'Grow repeat treatment, replenishment and membership visits where a short visit is a valid outcome.',
        reduce: 'Reduce isolated beauty campaigns that do not connect to service, health or daily routines.',
        campaignAngle: 'Create a weekly wellness route: booking, replenishment and a quick restorative service.',
      },
      sv: {
        title: 'Välmående fungerar bäst som en ärendeslinga',
        need: 'Kunden vill ha kontrollerad egenvård utan att det blir en tung shoppingresa.',
        recommendation: 'Koppla apotek, vårdtjänster, skönhet och träning till bokningar och vardagsärenden.',
        focus: 'Öka återkommande behandlingar, påfyllnad och medlemsbesök där ett kort besök räcker.',
        reduce: 'Minska fristående skönhetskampanjer som inte kopplas till service, hälsa eller vardagsrytm.',
        campaignAngle: 'Skapa en veckovis välmåenderutt: bokning, påfyllnad och snabb återhämtande service.',
      },
    },
  },
  {
    id: 'circular-value-loop',
    horizon: 'medium',
    move: 'recruit',
    categoryIds: ['fashion-apparel', 'services', 'home-furniture', 'electronics'],
    stores: ['Emmyn vaatekeräyspiste', 'Fonum', 'Clas Ohlson', 'Eurokangas', 'Suomalainen Kirjakauppa', 'Power'],
    text: {
      fi: {
        title: 'Kiertotalous tarvitsee korjauksen, huollon ja noudon',
        need: 'Arvo- ja vastuullisuustrendi ei muutu myynniksi, jos se jää pelkäksi vastuullisuusviestiksi.',
        recommendation: 'Tee palautuksesta, korjauksesta, huollosta ja uudelleenostosta yksi fyysinen asiointiketju.',
        focus: 'Lisää palveluja, jotka pidentävät tuotteen käyttöikää ja tuovat asiakkaan takaisin keskukseen.',
        reduce: 'Vähennä pelkkää alennusviestintää, jos sama asiakas voitaisiin ohjata korjaamaan, täydentämään tai vaihtamaan.',
        campaignAngle: 'Kampanjoi huolto-, keräys- ja vaihtoviikko, joka muuttaa vastuullisuuden uudeksi käynniksi.',
      },
      en: {
        title: 'Circularity should be anchored in repair and pickup',
        need: 'Value and sustainability do not convert if they remain only a responsibility message.',
        recommendation: 'Make return, repair, service and repurchase one physical chain.',
        focus: 'Add services that extend product life and bring the customer back to the centre.',
        reduce: 'Reduce pure discount messaging when the same customer could repair, replenish or exchange.',
        campaignAngle: 'Run a service, collection and exchange week where sustainability ends in a new visit.',
      },
      sv: {
        title: 'Cirkularitet bör förankras i reparation och upphämtning',
        need: 'Värde och hållbarhet konverterar inte om de bara blir ansvarskommunikation.',
        recommendation: 'Gör retur, reparation, service och återköp till en fysisk kedja.',
        focus: 'Lägg till tjänster som förlänger produktlivet och för kunden tillbaka till centret.',
        reduce: 'Minska ren rabattkommunikation när kunden kunde reparera, komplettera eller byta.',
        campaignAngle: 'Kör en service-, insamlings- och bytesvecka där hållbarhet slutar i ett nytt besök.',
      },
    },
  },
  {
    id: 'weatherproof-family-dwell',
    horizon: 'short',
    move: 'test',
    categoryIds: ['entertainment-experiences', 'books-toys-hobby', 'food-beverage', 'grocery-daily'],
    stores: ['Sellon kirjasto', 'Finnkino', 'BowlCircus', 'XS Lelut', 'Prisma', 'K-Citymarket'],
    text: {
      fi: {
        title: 'Perhekäynti syntyy säänkestävästä reitistä',
        need: 'Epävarma sää ja varovainen kulutus suosivat reittejä, joissa arkiostos ja viihde tukevat toisiaan.',
        recommendation: 'Yhdistä kirjasto, elokuva, leikki, ruoka ja hypermarket matalan riskin perhekäynniksi.',
        focus: 'Kasvata viipymää niin, että ostos ei ole käynnin ainoa perustelu.',
        reduce: 'Vältä tapahtumia, jotka eivät ohjaa seuraavaan tilaan tai mitattavaan vuokralaiskäyntiin.',
        campaignAngle: 'Tee viikonlopun sisäreitti, jossa perhe voi vaihtaa suunnitelmaa ilman kitkaa.',
      },
      en: {
        title: 'Family visits come from a weatherproof chain, not a single event',
        need: 'Uncertain weather and cautious spending favour routes where errands and entertainment support each other.',
        recommendation: 'Connect library, cinema, play, food and hypermarket into one low-risk family visit.',
        focus: 'Grow dwell time so shopping is not the only reason to come.',
        reduce: 'Avoid events that do not guide the visitor to the next space or measurable tenant visit.',
        campaignAngle: 'Create a weekend indoor route where families can change plans without friction.',
      },
      sv: {
        title: 'Familjebesök skapas av en vädersäker kedja, inte ett enskilt event',
        need: 'Osäkert väder och försiktig konsumtion gynnar rutter där ärenden och nöje stödjer varandra.',
        recommendation: 'Koppla bibliotek, bio, lek, mat och hypermarket till ett lågriskbesök för familjer.',
        focus: 'Öka vistelsetiden så att shopping inte är enda skälet att komma.',
        reduce: 'Undvik event som inte leder till nästa yta eller mätbart hyresgästbesök.',
        campaignAngle: 'Skapa en inomhusrutt för helgen där familjer kan ändra plan utan friktion.',
      },
    },
  },
];

function pickLang(lang?: string | null): Lang {
  const l = (lang ?? 'en').slice(0, 2).toLowerCase();
  return l === 'fi' || l === 'sv' ? l : 'en';
}

function tenantRecord(tenant: Tenant): TenantImpactStore {
  return { name: tenant.name, category: tenant.category, floor: tenant.floor, location: tenant.location };
}

const TENANT_POOLS: Record<string, Tenant[]> = {
  'realidea-sello': SELLO_TENANTS,
  'realidea-tripla': TRIPLA_TENANTS,
};

export function getTenantImpactInsights(mallId: string, lang?: string | null): TenantImpactInsight[] {
  const pool = TENANT_POOLS[mallId];
  if (!pool) return [];
  const L = pickLang(lang);
  return TEMPLATES.map((template) => {
    const stores = mallId === 'realidea-sello'
      ? template.stores
          .map((name) => pool.find((tenant) => tenant.name === name))
          .filter((tenant): tenant is Tenant => Boolean(tenant))
      : pickByCategory(pool, template.categoryIds);
    return {
      id: template.id,
      ...template.text[L],
      horizon: template.horizon,
      move: template.move,
      categoryIds: template.categoryIds,
      stores: stores.map(tenantRecord),
      liveInputs: ['tenant_mix', 'floorplan', 'footfall', 'pos', 'lease_dates', 'campaign_results'],
    };
  });
}

export function getTenantCampaignSeed(mallId: string, lang?: string | null) {
  const insights = getTenantImpactInsights(mallId, lang);
  const stores = new Map<string, TenantImpactStore>();
  for (const insight of insights) {
    for (const store of insight.stores) {
      const existing = stores.get(store.name);
      stores.set(store.name, {
        ...store,
        categoryIds: Array.from(new Set([...(existing?.categoryIds ?? []), ...insight.categoryIds])),
        insightIds: Array.from(new Set([...(existing?.insightIds ?? []), insight.id])),
      });
    }
  }
  return {
    categories: Array.from(new Set(insights.flatMap((insight) => insight.categoryIds))),
    stores: Array.from(stores.values()),
    insights,
  };
}
