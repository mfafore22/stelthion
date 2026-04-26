/**
 * Seeds realistic demo data into the ShopperMind service for prospect demonstrations.
 *
 * Creates:
 *   - Markets: helsinki-fi, tampere-fi
 *   - 10 phenomena per market with varied lifecycle states
 *   - 14 days of PhenomenonScore rows
 *   - 7 SignalOfTheDay rows per market
 *
 * Every Phenomenon carries a structured `i18n` column with `{ en, fi, sv }`
 * variants (label, summary, stateCommentary, retailerImpact). SignalOfTheDay
 * carries `{ en: { narrative }, fi: { narrative }, sv: { narrative } }`. This
 * is what the UI reads when rendering in FI or SV — the top-level `label`
 * and `description` columns remain English for backwards compatibility and
 * fallback.
 *
 * Usage (from repo root):
 *   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
 *   npx tsx services/shoppermind/scripts/seed-demo.ts
 */

import { prisma as prismaFactory } from '../src/db/prisma.js';

const prisma = prismaFactory();

const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);

const DEFAULT_THRESHOLDS = {
  'TREND:composite:COUNTRY': { publish: 0.7, review: 0.4, reject: 0.2 },
  'EVENT:composite:COUNTRY': { publish: 0.7, review: 0.4, reject: 0.2 },
};

type Lang = 'en' | 'fi' | 'sv';

const MARKETS = [
  {
    id: 'helsinki-fi',
    country: 'FI',
    region: 'Uusimaa',
    displayName: 'Helsinki',
    industryFocus: 'Retail & Food',
    geoAnchorLat: 60.1699,
    geoAnchorLon: 24.9384,
    footTrafficSubs: ['fi_retail', 'fi_foodservice'],
    culturalSubs: ['fi_culture', 'fi_lifestyle'],
    footTrafficAxisWeight: 0.6,
    culturalAxisWeight: 0.4,
    profile: {
      displayName: 'Helsinki',
      industryFocus: 'Retail & Food',
      language: 'fi',
      persona:
        'Helsinki mall leasing and category managers balancing Finnish everyday retail with regional tourism demand.',
      categoryKeywords: {},
      relevanceKeywords: [],
      weightPriors: {},
      seedSources: [],
    },
    policy: {
      version: 1 as const,
      thresholds: DEFAULT_THRESHOLDS,
    },
  },
  {
    id: 'tampere-fi',
    country: 'FI',
    region: 'Pirkanmaa',
    displayName: 'Tampere',
    industryFocus: 'Retail & Entertainment',
    geoAnchorLat: 61.4978,
    geoAnchorLon: 23.761,
    footTrafficSubs: ['fi_retail', 'fi_entertainment'],
    culturalSubs: ['fi_culture', 'fi_youth'],
    footTrafficAxisWeight: 0.55,
    culturalAxisWeight: 0.45,
    profile: {
      displayName: 'Tampere',
      industryFocus: 'Retail & Entertainment',
      language: 'fi',
      persona:
        'Tampere mall operators serving a younger, entertainment-led catchment across Pirkanmaa.',
      categoryKeywords: {},
      relevanceKeywords: [],
      weightPriors: {},
      seedSources: [],
    },
    policy: {
      version: 1 as const,
      thresholds: {
        'TREND:composite:COUNTRY': { publish: 0.65, review: 0.35, reject: 0.2 },
        'EVENT:composite:COUNTRY': { publish: 0.65, review: 0.35, reject: 0.2 },
      },
    },
  },
];

type TrendState = 'EMERGING' | 'ACCELERATING' | 'STABLE' | 'FADING' | 'DORMANT';

interface StateDateRange {
  firstSeenDays: [number, number];
  lastSignalDays: [number, number];
}

const STATE_DATE_RANGES: Record<TrendState, StateDateRange> = {
  EMERGING: { firstSeenDays: [30, 75], lastSignalDays: [0, 2] },
  ACCELERATING: { firstSeenDays: [90, 210], lastSignalDays: [0, 2] },
  STABLE: { firstSeenDays: [240, 540], lastSignalDays: [2, 7] },
  FADING: { firstSeenDays: [300, 720], lastSignalDays: [9, 21] },
  DORMANT: { firstSeenDays: [540, 1080], lastSignalDays: [35, 90] },
};

function pickInRange(seed: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return min;
  const v = Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1;
  return min + Math.floor(v * (span + 1));
}

const STATE_COMMENTARY: Record<Lang, Record<TrendState, string>> = {
  en: {
    EMERGING:
      'volume is low but growing steadily, with new sources joining the cluster each week. Treat as directional, not yet actionable at scale.',
    ACCELERATING:
      'signal volume and velocity are both trending up. Sources have diversified and there is clear cross-category pickup — act this quarter.',
    STABLE:
      'the trend has reached a new equilibrium. Growth has slowed but share is durable. Treat as a permanent input to category planning.',
    FADING:
      'velocity has turned negative for several consecutive periods. Residual share remains but the strategic opportunity window is closing.',
    DORMANT:
      'no material new signal in the last 30 days. Keep under observation; historical pattern suggests possible seasonal re-emergence.',
  },
  fi: {
    EMERGING:
      'signaali on vielä heikko, mutta kasvaa tasaisesti ja uusia lähteitä tulee mukaan viikoittain. Käsittele suuntaa-antavana — ei vielä laajan mittakaavan päätöksille.',
    ACCELERATING:
      'sekä signaali että kasvuvauhti ovat nousussa. Lähteet ovat monipuolistuneet ja eri kategorioiden läpi näkyy selkeää vetovoimaa — toimi tämän neljänneksen aikana.',
    STABLE:
      'trendi on löytänyt uuden tasapainon. Kasvu on hidastunut, mutta osuus on kestävä. Käsittele pysyvänä lähtötietona kategoriasuunnittelussa.',
    FADING:
      'kasvuvauhti on ollut negatiivinen useita peräkkäisiä jaksoja. Jäännöosuus säilyy, mutta strateginen mahdollisuusikkuna sulkeutuu.',
    DORMANT:
      'viimeisten 30 päivän aikana ei ole tullut olennaisia uusia signaaleja. Pidä seurannassa — historiallinen kuvio viittaa mahdolliseen kausiluonteiseen paluuseen.',
  },
  sv: {
    EMERGING:
      'signalvolymen är låg men växer stadigt, och nya källor ansluter sig till klustret varje vecka. Tolka som riktningsvisande — ännu inte skalbart för åtgärder.',
    ACCELERATING:
      'både signalvolym och tillväxttakt pekar uppåt. Källorna har diversifierats och det finns tydlig bredd över kategorier — agera detta kvartal.',
    STABLE:
      'trenden har nått en ny jämvikt. Tillväxten har saktat in men andelen är bestående. Behandla som en permanent input i kategoriplanering.',
    FADING:
      'tillväxttakten har varit negativ flera perioder i rad. En restandel finns kvar men det strategiska möjlighetsfönstret sluts.',
    DORMANT:
      'inga väsentliga nya signaler på 30 dagar. Håll under observation — historiskt mönster antyder möjlig säsongsbunden återkomst.',
  },
};

const STATE_NAME: Record<Lang, Record<TrendState, string>> = {
  en: {
    EMERGING: 'emerging',
    ACCELERATING: 'accelerating',
    STABLE: 'stable',
    FADING: 'fading',
    DORMANT: 'dormant',
  },
  fi: {
    EMERGING: 'nouseva',
    ACCELERATING: 'kiihtyvä',
    STABLE: 'vakiintunut',
    FADING: 'hiipuva',
    DORMANT: 'lepotilassa',
  },
  sv: {
    EMERGING: 'växande',
    ACCELERATING: 'accelererande',
    STABLE: 'stabil',
    FADING: 'avtagande',
    DORMANT: 'vilande',
  },
};

interface LocalizedContent {
  label: string;
  summary: string;
  retailerImpact: string;
  opportunity: string;
}

interface PhenomenonTemplate {
  state: TrendState;
  categories: string[];
  keywords: string[];
  i18n: Record<Lang, LocalizedContent>;
}

const PHENOMENA_TEMPLATES: PhenomenonTemplate[] = [
  {
    state: 'ACCELERATING',
    categories: ['retail', 'experience'],
    keywords: ['pop-up', 'immersive', 'event-retail', 'in-store activation'],
    i18n: {
      en: {
        label: 'Experiential Retail Resurgence',
        summary:
          'Shoppers increasingly reward stores that stage in-person moments — launch events, pop-ups, creator meetups — over pure product displays. Velocity is rising fastest in urban flagship malls.',
        retailerImpact:
          'Retailers who dedicate 10–20% of floor area to rotating activations see measurable dwell-time and repeat-visit lifts. Static merchandising alone is losing share of mind; plan quarterly event calendars and train staff as hosts, not cashiers.',
        opportunity:
          'Lock in a 90-day activation calendar with three tenant-led events. Pair each with a member-only RSVP via the loyalty app and measure dwell-time uplift on the host weekend versus the prior four Saturdays.',
      },
      fi: {
        label: 'Elämyksellisen kaupan nousu',
        summary:
          'Asiakkaat palkitsevat yhä useammin liikkeitä, jotka järjestävät kohtaamisia — lanseerauksia, pop-upeja, tekijätapaamisia — pelkän tuote-esittelyn sijaan. Kasvu on nopeinta kaupunkien lippulaivakauppakeskuksissa.',
        retailerImpact:
          'Kauppiaat, jotka omistavat 10–20 % pinta-alasta vaihtuville tapahtumille, näkevät mitattavan nousun viipymässä ja uusintakäynneissä. Pelkkä staattinen esillepano menettää näkyvyyttä — suunnittele neljännesvuosittainen tapahtumakalenteri ja kouluta henkilökunta isänniksi kassatyön sijaan.',
        opportunity:
          'Sovi 90 päivän aktivointikalenteri kolmen vuokralaistapahtuman ympärille. Liitä jokaiseen jäsenten ennakkoilmoittautuminen kanta-asiakassovelluksessa ja mittaa viipymän muutosta tapahtumalauantaina edeltäviin neljään lauantaihin verrattuna.',
      },
      sv: {
        label: 'Upplevelsehandelns återkomst',
        summary:
          'Kunder belönar allt oftare butiker som iscensätter fysiska möten — lanseringar, pop-ups, creator-träffar — framför ren produktexponering. Tillväxten är starkast i urbana flaggskeppsgallerior.',
        retailerImpact:
          'Butiker som avsätter 10–20 % av golvytan åt roterande aktiveringar ser mätbar ökning i uppehållstid och återbesök. Statisk exponering tappar andel — planera kvartalsvisa evenemangskalendrar och utbilda personal till värdar snarare än kassörer.',
        opportunity:
          'Sätt en 90-dagars aktiveringskalender med tre hyresgästledda evenemang. Koppla varje till medlems-RSVP i lojalitetsappen och mät uppehållstidsförändring under värdhelgen jämfört med de fyra föregående lördagarna.',
      },
    },
  },
  {
    state: 'STABLE',
    categories: ['food', 'health'],
    keywords: ['protein', 'low-sugar', 'functional-food', 'label-reading'],
    i18n: {
      en: {
        label: 'Health-Conscious Snacking',
        summary:
          'Demand for high-protein, low-sugar and functional snacks has plateaued at a structurally higher level — it is no longer a spike, it is the new baseline across supermarket and convenience formats.',
        retailerImpact:
          'Treat the category as permanent shelf space, not a fad end-cap. Audit snack assortments for protein/fibre/sugar claims; negotiate listings with domestic functional-food brands before legacy sugar-heavy SKUs cannibalise the adjacency.',
        opportunity:
          'Reserve a permanent functional-snack bay at register-adjacency for the next planogram cycle. Track 12-week sales-per-shelf-metre against the legacy snack bay to validate the swap before scaling.',
      },
      fi: {
        label: 'Terveystietoiset välipalat',
        summary:
          'Kysyntä runsasproteiinisille, vähäsokerisille ja toiminnallisille välipaloille on tasaantunut rakenteellisesti korkeammalle tasolle — kyseessä ei ole enää piikki vaan uusi perustaso marketeissa ja lähikaupoissa.',
        retailerImpact:
          'Käsittele kategoriaa pysyvänä hyllytilana, ei ohimenevänä hyllypäätyilmiönä. Tarkasta välipalavalikoima proteiini-, kuitu- ja sokeri-väittämien osalta ja neuvottele kotimaisten toiminnallisten ruokien brändien kanssa ennen kuin sokeripitoiset perus-SKUt vievät vierushyllyn osuuden.',
        opportunity:
          'Varaa pysyvä toiminnallisten välipalojen hylly kassan vierustalle seuraavaa hyllykarttaa varten. Mittaa myyntiä per hyllymetri 12 viikon ajalta ja vertaa perinteiseen välipalahyllyyn ennen laajempaa skaalausta.',
      },
      sv: {
        label: 'Hälsosamma mellanmål',
        summary:
          'Efterfrågan på proteinrika, sockerfattiga och funktionella mellanmål har planat ut på en strukturellt högre nivå — det är inte längre en topp utan den nya basen i stormarknader och närbutiker.',
        retailerImpact:
          'Behandla kategorin som permanent hyllyta, inte som en förbigående gaveldisplay. Granska mellanmålssortimentet för protein-, fiber- och sockerpåståenden, och förhandla listningar med inhemska funktionella varumärken innan sockertunga bas-SKU:er kannibaliserar grannhyllan.',
        opportunity:
          'Reservera en permanent funktionsmellanmålshylla intill kassan i nästa planogramcykel. Mät försäljning per hyllmeter över 12 veckor mot den traditionella mellanmålshyllan innan du skalar upp.',
      },
    },
  },
  {
    state: 'EMERGING',
    categories: ['sustainability', 'fashion'],
    keywords: ['pre-loved', 'circular', 'resale', 'take-back'],
    i18n: {
      en: {
        label: 'Secondhand & Recommerce',
        summary:
          'Branded resale, take-back programmes and mall-curated vintage are moving from pilots into permanent store formats. Finnish shoppers under 35 now name recommerce as a first-choice channel for fashion.',
        retailerImpact:
          'Hosting a resale corner — whether operator-run or partnered with a platform — raises footfall without diluting margin on new-goods. Expect lease concepts requesting take-back logistics and tagging; bake this into new-tenant fit-out briefs.',
        opportunity:
          'Pilot a 200 m² curated resale corner with a single platform partner this autumn. Add resale-clause language to two new-tenant lease templates so take-back logistics is on the table from the first negotiation.',
      },
      fi: {
        label: 'Kierrätys ja uudelleenmyynti',
        summary:
          'Brändivetoinen uudelleenmyynti, palautusohjelmat ja kauppakeskusten kuratoima vintage siirtyvät piloteista pysyviksi myymäläformaateiksi. Alle 35-vuotiaat suomalaiset nimeävät kierrätyskaupan nyt ensisijaiseksi muodin ostokanavaksi.',
        retailerImpact:
          'Uudelleenmyyntinurkkauksen isännöinti — joko operaattorin pyörittämänä tai alustakumppanuutena — nostaa asiakasvirtaa ilman, että uusien tuotteiden kate laskee. Odota, että vuokralaiset edellyttävät palautuslogistiikkaa ja tuotetunnisteita; kirjaa nämä uusien vuokralaisten fit-out-ohjeisiin.',
        opportunity:
          'Pilotoi 200 m² kuratoitu kierrätysmuodin nurkkaus yhden alustakumppanin kanssa tänä syksynä. Lisää kierrätyspykälä kahteen uuden vuokralaisen sopimuspohjaan, jotta palautuslogistiikka on neuvottelupöydällä jo ensi tapaamisesta lähtien.',
      },
      sv: {
        label: 'Secondhand och återbruk',
        summary:
          'Varumärkesägd återförsäljning, återtagsprogram och gallerie-kurerad vintage går från pilot till permanenta butiksformat. Finska kunder under 35 anger nu återbruk som förstahandskanalen för mode.',
        retailerImpact:
          'Att ha ett secondhand-hörn — oavsett om operatören driver det själv eller partnerskap med en plattform — höjer besöksflödet utan att späda marginalen på nytt. Vänta dig hyresgäster som kräver återtagslogistik och märkning; bygg in detta i fit-out-briefer för nya hyresgäster.',
        opportunity:
          'Piloter ett 200 m² kuraterat secondhand-hörn med en plattformspartner i höst. Lägg in återtagsklausul i två nya hyresgästavtal så att återtagslogistiken finns på bordet från första förhandlingen.',
      },
    },
  },
  {
    state: 'EMERGING',
    categories: ['workspace', 'retail'],
    keywords: ['remote-work', 'third-place', 'hotdesk', 'meeting-pods'],
    i18n: {
      en: {
        label: 'Co-Working in Mall Spaces',
        summary:
          'Hybrid workers are colonising mall cafés and lounge areas on weekdays. Several mid-sized Nordic malls have begun leasing quiet floors as daypass workspaces, anchored by food and fitness tenants.',
        retailerImpact:
          'Weekday mid-day traffic can be grown with dedicated workspace zones (power, wifi, quiet). F&B tenants on those floors convert the best. Rethink 11:00–15:00 programming — this is no longer a dead window.',
        opportunity:
          'Designate one quiet floor or wing as a workday lounge by Q3: power outlets, fast wifi, single-cup F&B priced for daily use. Bundle a €9 daypass with a partner café credit and watch weekday 11:00–15:00 covers.',
      },
      fi: {
        label: 'Etätyötilat kauppakeskuksissa',
        summary:
          'Hybridityöntekijät valtaavat kauppakeskusten kahviloita ja loungetiloja arkisin. Useat keskisuuret pohjoismaiset kauppakeskukset ovat alkaneet vuokrata hiljaisia kerroksia päiväliputettuina työskentelytiloina, joissa ruoka- ja liikuntavuokralaiset toimivat ankkureina.',
        retailerImpact:
          'Arkipäivien keskipäivän asiakasvirtaa voi kasvattaa omistamalla selkeät työskentelyalueet (virta, wifi, hiljaisuus). Näillä kerroksilla ruokavuokralaisten konversio on paras. Mieti uudelleen klo 11–15 ohjelma — se ei ole enää kuollut aikaikkuna.',
        opportunity:
          'Nimeä yksi hiljainen kerros tai siipi arjen loungeksi Q3:n loppuun mennessä: pistorasiat, nopea wifi, yhden hengen ruoka-annokset arkihintaan. Yhdistä 9 € päivälippu kahvilakumppanin tarjoukseen ja seuraa arkien klo 11–15 myyntiä.',
      },
      sv: {
        label: 'Coworking i gallerior',
        summary:
          'Hybridarbetare tar över galleriornas caféer och lounger under vardagar. Flera mellanstora nordiska gallerior har börjat hyra ut tysta våningar som dagspass-arbetsplatser, med mat- och träningshyresgäster som ankare.',
        retailerImpact:
          'Mittdagstrafiken på vardagar kan växa med dedikerade arbetszoner (ström, wifi, tyst). F&B-hyresgäster på dessa våningar konverterar bäst. Tänk om kring 11:00–15:00-programmet — det är inte längre ett dött tidsfönster.',
        opportunity:
          'Utse en tyst våning eller flygel till vardagslounge senast Q3: eluttag, snabb wifi, enportions-F&B prissatt för daglig användning. Paketera ett 9 €-dagspass med kreditbelopp hos en cafépartner och följ vardagstrafiken 11:00–15:00.',
      },
    },
  },
  {
    state: 'ACCELERATING',
    categories: ['sports', 'outdoor'],
    keywords: ['hiking', 'paddling', 'all-weather', 'technical-apparel'],
    i18n: {
      en: {
        label: 'Nordic Outdoor Lifestyle',
        summary:
          'All-weather outdoor gear, paddling and trail-running categories show double-digit share growth year on year across Finnish specialty retail, driven by both residents and regional inbound tourism.',
        retailerImpact:
          'Outdoor anchors are high-pull, low-discount tenants — prioritise renewals and consider experiential adjacencies (rental counters, repair bars). Visual-merchandising seasonality should swing harder: spring paddle / autumn trail / winter nordic.',
        opportunity:
          'Lock in 5-year renewals with the top two outdoor anchors before competitors bid. Add a shared rental + repair counter co-funded by tenants — the service drives 1.6× return-visit rate vs. pure retail floors.',
      },
      fi: {
        label: 'Pohjoismainen ulkoilukulttuuri',
        summary:
          'Kaikkien säiden ulkoiluvarusteet, meloonta ja polkujuoksu näyttävät kaksinumeroista osuuden kasvua vuositasolla suomalaisessa erikoiskaupassa — sekä asukkaiden että alueellisen matkailun vetämänä.',
        retailerImpact:
          'Ulkoilun ankkuriliikkeet ovat voimakkaasti vetäviä, vähän alennuksia käyttäviä vuokralaisia — priorisoi jatkosopimuksia ja harkitse elämyksellisiä vierusliikkeitä (vuokrauspisteet, huoltopisteet). Visuaalisen esillepanon kausivaihtelu saa olla voimakkaampi: kevät meloonta / syksy polut / talvi hiihto.',
        opportunity:
          'Lukitse kahden parhaan ulkoiluankkurin kanssa 5 vuoden jatkosopimukset ennen kuin kilpailijat ehtivät tarjota. Rakenna yhteinen vuokraus- ja huoltopiste vuokralaisten yhteisrahoituksella — palvelu nostaa uusintakäyntejä noin 1,6-kertaisesti pelkkään myymälään verrattuna.',
      },
      sv: {
        label: 'Nordiskt friluftsliv',
        summary:
          'Friluftsutrustning för alla väder, paddling och trailrunning visar tvåsiffrig andelstillväxt år över år i finsk specialhandel — drivet av både boende och regional turism.',
        retailerImpact:
          'Friluftsankaren är hyresgäster med hög dragkraft och låg rabattnivå — prioritera omförhandlingar och överväg upplevelsebaserade grannbutiker (uthyrningsdiskar, reparationsbarer). Visuell säsongsväxling bör vara tydligare: vår paddling / höst trail / vinter nordic.',
        opportunity:
          'Lås in 5-årsförlängningar med de två starkaste friluftsankarna innan konkurrenter hinner bjuda. Lägg till en gemensam uthyrnings- och reparationsdisk samfinansierad av hyresgästerna — tjänsten driver cirka 1,6× återbesöksfrekvens jämfört med rena butiksvåningar.',
      },
    },
  },
  {
    state: 'STABLE',
    categories: ['food', 'sustainability'],
    keywords: ['vegan', 'oat-milk', 'plant-protein', 'flexitarian'],
    i18n: {
      en: {
        label: 'Plant-Based Expansion',
        summary:
          'Plant-based ranges have matured from novelty into permanent SKUs in supermarkets and QSR menus. Growth has flattened, but substitution is now structural rather than trial-driven.',
        retailerImpact:
          'Stop promoting plant-based as a theme; integrate it into everyday assortment logic. Grocery tenants should benchmark vegan share against category average; QSRs should ensure at least one plant default in each menu slot.',
        opportunity:
          'Move plant-based out of seasonal promo and into the core planogram for the next reset. Ask QSR tenants for a plant-default option per menu slot in their next contract review — small ask, durable category lift.',
      },
      fi: {
        label: 'Kasvipohjaisten tuotteiden kasvu',
        summary:
          'Kasvipohjaiset valikoimat ovat kypsyneet uutuudesta pysyviksi SKUiksi marketeissa ja pikaruokaketjujen listoilla. Kasvu on tasaantunut, mutta korvautuminen on nyt rakenteellista — ei enää kokeiluvetoista.',
        retailerImpact:
          'Lopeta kasvipohjaisten tuotteiden markkinointi teemana ja integroi se arjen valikoimalogiikkaan. Ruokakauppavuokralaisten kannattaa verrata vegaaniosuutta kategorian keskiarvoon; pikaruokapaikkojen kannattaa varmistaa vähintään yksi kasvipohjainen oletusvalinta joka menuruudussa.',
        opportunity:
          'Siirrä kasvipohjaiset tuotteet kausikampanjasta vakiohyllykarttaan seuraavan päivityksen yhteydessä. Pyydä pikaruokavuokralaisia tarjoamaan yksi kasvipohjainen oletusvalinta per menuruutu seuraavassa sopimuskatsauksessa — pieni pyyntö, pysyvä kategorian nosto.',
      },
      sv: {
        label: 'Växtbaserad expansion',
        summary:
          'Växtbaserade sortiment har mognat från nyhet till permanenta SKU:er i stormarknader och snabbmatsmenyer. Tillväxten har planat ut, men substitutionen är nu strukturell — inte längre försöksdriven.',
        retailerImpact:
          'Sluta marknadsföra växtbaserat som ett tema och integrera det i vardaglig sortimentslogik. Livsmedelshyresgäster bör jämföra veganandelen mot kategorins snitt; snabbmatskedjor bör säkerställa minst ett växtbaserat förval per meny-slot.',
        opportunity:
          'Flytta växtbaserat från säsongskampanj in i kärnplanogrammet vid nästa reset. Be snabbmatshyresgäster införa ett växtbaserat förval per meny-slot i nästa avtalsöversyn — liten begäran, varaktig kategoritillväxt.',
      },
    },
  },
  {
    state: 'FADING',
    categories: ['fashion', 'luxury'],
    keywords: ['dupe', 'affordable-premium', 'value-luxury', 'mid-tier'],
    i18n: {
      en: {
        label: 'Affordable Luxury Shift',
        summary:
          'The "dupe" cycle around accessible-luxury apparel and accessories is past peak. Shoppers are increasingly choosing either clearly budget or clearly premium; the mid-tier is losing share.',
        retailerImpact:
          'Reassess the mid-tier fashion mix. Expect negotiations and tenant turnover in the €80–€250 price band. Back-fill with either strong value players or concept stores that offer real premium justification.',
        opportunity:
          'Audit every €80–€250 lease coming up in the next 18 months and decide each one as value or premium — no in-between renewals. Pre-line two value and two concept replacements so vacancy windows stay under 60 days.',
      },
      fi: {
        label: 'Keskihintaisen luksuksen murros',
        summary:
          'Saavutettavan luksuksen "dupe"-kierto vaatteissa ja asusteissa on ohittanut huippunsa. Ostajat valitsevat yhä useammin joko selvästi edullisen tai selvästi premiumin — keskisegmentti menettää osuutta.',
        retailerImpact:
          'Arvioi keskisegmentin muotivalikoima uudelleen. Odota uusia neuvotteluja ja vuokralaisten vaihtuvuutta 80–250 €:n hintakaistalla. Täytä paikat joko vahvoilla value-toimijoilla tai konseptiliikkeillä, jotka tarjoavat aitoa premium-perustetta.',
        opportunity:
          'Käy läpi kaikki seuraavan 18 kuukauden 80–250 €:n vuokrasopimukset ja päätä jokainen joko value- tai premium-suunnan mukaan — ei keskitien jatkoja. Pidä jonossa kaksi value- ja kaksi konseptikorvaajaa, jotta vajaakäyttöjaksot pysyvät alle 60 päivän.',
      },
      sv: {
        label: 'Prisvärd lyx förskjuts',
        summary:
          '"Dupe"-cykeln kring tillgänglig lyx i kläder och accessoarer har passerat sin topp. Kunder väljer allt oftare antingen tydligt budget eller tydligt premium — mellansegmentet tappar andel.',
        retailerImpact:
          'Omvärdera mellansegmentets modemix. Räkna med omförhandlingar och hyresgästomsättning i prisbandet 80–250 €. Fyll på med antingen starka value-aktörer eller konceptbutiker som erbjuder reell premium-motivering.',
        opportunity:
          'Granska alla 80–250 €-avtal som löper ut de närmaste 18 månaderna och bestäm varje som value eller premium — inga mellanförlängningar. Förbered två value- och två konceptersättare så att vakansfönstren stannar under 60 dagar.',
      },
    },
  },
  {
    state: 'EMERGING',
    categories: ['loyalty', 'tech'],
    keywords: ['app-loyalty', 'digital-stamp', 'gamification', 'wallet-pass'],
    i18n: {
      en: {
        label: 'Digital-Physical Loyalty',
        summary:
          'Mall-wide loyalty apps combining tenant rewards, digital stamps and push-driven missions are being launched across the Nordics. Early operators report 3–5× higher redemption rates than card-based schemes.',
        retailerImpact:
          'Mall operators should evaluate a property-level app vs. federating tenant apps. Retailers joining early get cross-tenant traffic lift; late joiners risk exclusion from curated offers the app surfaces to members.',
        opportunity:
          'Scope a property-level loyalty app this quarter — even an MVP with three tenants and two missions. First-mover operators are reporting 3–5× higher redemption; the app becomes the cross-sell channel competitors do not have.',
      },
      fi: {
        label: 'Digi-fyysinen kanta-asiakkuus',
        summary:
          'Kauppakeskusten laajuiset kanta-asiakassovellukset, jotka yhdistävät vuokralaisten edut, digitaaliset leimat ja push-tehtävät, lanseerataan eri puolilla Pohjoismaita. Ensimmäiset operaattorit raportoivat 3–5 kertaa korkeammista lunastusasteista korttipohjaisiin järjestelmiin verrattuna.',
        retailerImpact:
          'Kauppakeskusoperaattoreiden kannattaa vertailla kiinteistötason sovellusta ja vuokralaisten sovellusten liittoa. Aikaisin mukaan tulevat kauppiaat saavat ristivuokralaisasiakasvirtaa; myöhässä liittyvät riskeeraavat jäävänsä sovelluksen kuratoimien jäsenetujen ulkopuolelle.',
        opportunity:
          'Kartoita kiinteistötason kanta-asiakassovellus tämän vuosineljänneksen aikana — vaikka MVP:nä, jossa on kolme vuokralaista ja kaksi tehtävää. Ensimmäisen toimijat raportoivat 3–5 kertaa korkeampia lunastusasteita; sovelluksesta tulee ristimyyntikanava, jota kilpailijoilla ei ole.',
      },
      sv: {
        label: 'Digital-fysisk lojalitet',
        summary:
          'Gallerie-breda lojalitetsappar som kombinerar hyresgästrabatter, digitala stämplar och push-uppdrag lanseras runt om i Norden. Tidiga operatörer rapporterar 3–5× högre inlösenfrekvens än kortbaserade system.',
        retailerImpact:
          'Gallerieoperatörer bör utvärdera en fastighetsövergripande app jämfört med en federation av hyresgästers appar. Hyresgäster som ansluter sig tidigt får lyft i korsflöde; sena anslutare riskerar att hamna utanför kuraterade erbjudanden appen visar medlemmarna.',
        opportunity:
          'Scope:a en fastighetsövergripande lojalitetsapp redan i kvartalet — även som MVP med tre hyresgäster och två uppdrag. Tidiga aktörer rapporterar 3–5× högre inlösen; appen blir korsförsäljningskanalen som konkurrenter saknar.',
      },
    },
  },
  {
    state: 'STABLE',
    categories: ['food', 'behaviour'],
    keywords: ['quick-lunch', 'grab-go', 'micro-dining', '15-minute-meal'],
    i18n: {
      en: {
        label: 'Micro-Break Dining',
        summary:
          'Shoppers increasingly plan 15–25 minute food stops rather than traditional lunches. Grab-and-go, counter seating and single-serve formats keep gaining share against sit-down casual dining.',
        retailerImpact:
          'Food courts should reprice for speed: counter-ordering, card-only, single-portion pricing. Casual sit-down tenants need to add express menus or lose weekday share to grab-and-go competitors.',
        opportunity:
          'Require an express-menu addendum at the next two casual-dining lease renewals. Re-stripe one food-court row for counter-only ordering this quarter and benchmark covers-per-hour against the seated rows.',
      },
      fi: {
        label: 'Pikalounas ja mikrotauot',
        summary:
          'Asiakkaat suunnittelevat yhä useammin 15–25 minuutin ruokataukoja perinteisen lounaan sijaan. Take-away, tiskipaikat ja yhden hengen annosformaatit jatkavat osuuden kasvattamista rennon pöytäruokailun kustannuksella.',
        retailerImpact:
          'Ruokakeskusten kannattaa hinnoitella nopeutta: tiskitilauksia, vain korttimaksua ja yhden annoksen hintoja. Rento pöytäruokailu tarvitsee pikamenut tai menettää arkipäivien osuuden take-away-kilpailijoille.',
        opportunity:
          'Vaadi pikamenun liite seuraavissa kahdessa rennon ravintolan jatkosopimuksessa. Merkitse yksi ruokakeskuksen rivi tiskitilausvyöhykkeeksi tämän neljänneksen aikana ja vertaa annoksia tunnissa pöytäpalveluriviin.',
      },
      sv: {
        label: 'Snabblunch och mikro-pauser',
        summary:
          'Kunder planerar allt oftare 15–25-minuters matpauser snarare än traditionella luncher. Grab-and-go, diskplatser och enportionsformat fortsätter ta andel från avslappnad sittlunch.',
        retailerImpact:
          'Matgallerior bör prissätta för snabbhet: diskbeställning, endast kort, enportionsprissättning. Avslappnade sittrestauranger måste lägga till expressmenyer eller tappa vardagsandel till grab-and-go-konkurrenter.',
        opportunity:
          'Kräv ett expressmeny-tillägg vid nästa två omförhandlingar av casual-dining-avtal. Markera en rad i matgallerian som diskbeställningszon under kvartalet och jämför portioner per timme mot sittraderna.',
      },
    },
  },
  {
    state: 'ACCELERATING',
    categories: ['beauty', 'wellness'],
    keywords: ['clean-beauty', 'skin-health', 'holistic', 'dermocosmetics'],
    i18n: {
      en: {
        label: 'Wellness Beauty Integration',
        summary:
          'Beauty shoppers now expect skin-health credentials (derm-backed claims, ingredient transparency) rather than pure cosmetics positioning. The category is blurring into pharmacy and supplements.',
        retailerImpact:
          'Beauty anchors with licensed staff or derm-partnerships convert significantly better. Mall operators should consider co-location of beauty, pharmacy and supplements; cross-tenant promotions perform strongly here.',
        opportunity:
          'Cluster beauty, pharmacy and supplements on a single floor in the next layout review. Run a joint loyalty bundle (beauty + pharmacy + supplement) for 90 days and measure cross-tenant basket lift before locking the layout.',
      },
      fi: {
        label: 'Kauneuden ja hyvinvoinnin yhdistyminen',
        summary:
          'Kauneustuotteiden asiakkaat odottavat nyt iho-terveyden perusteita (dermatologisesti tuettuja väittämiä, ainesosien läpinäkyvyyttä) pelkän kosmetiikan sijaan. Kategoria hämärtyy apteekkia ja ravintolisiä kohti.',
        retailerImpact:
          'Kauneuden ankkuriliikkeet, joissa on sertifioitua henkilökuntaa tai dermatologikumppanuuksia, konvertoivat selvästi paremmin. Kauppakeskusoperaattoreiden kannattaa harkita kauneuden, apteekin ja ravintolisien sijoittamista lähekkäin; ristivuokralaiskampanjat toimivat täällä vahvasti.',
        opportunity:
          'Klusteroi kauneus, apteekki ja ravintolisät samalle kerrokselle seuraavan tilakatsauksen yhteydessä. Aja yhteinen kanta-asiakaskampanja (kauneus + apteekki + ravintolisät) 90 päivän ajan ja mittaa ristikorin nousu ennen pohjapiirroksen lukitsemista.',
      },
      sv: {
        label: 'Skönhet möter wellness',
        summary:
          'Skönhetskunder förväntar sig nu hudhälsoargument (dermatologiskt underbyggda påståenden, innehållstransparens) snarare än ren kosmetikapositionering. Kategorin blandas in i apotek och kosttillskott.',
        retailerImpact:
          'Skönhetsankaren med licensierad personal eller dermatologiska partnerskap konverterar betydligt bättre. Gallerieoperatörer bör överväga samlokalisering av skönhet, apotek och kosttillskott; tvärhyresgästkampanjer presterar starkt här.',
        opportunity:
          'Klustra skönhet, apotek och kosttillskott på samma våning vid nästa layoutöversyn. Kör en gemensam lojalitetspaketering (skönhet + apotek + kosttillskott) i 90 dagar och mät korslyft i kundkorgen innan layouten låses.',
      },
    },
  },
];

const LANGS: Lang[] = ['en', 'fi', 'sv'];

function buildDescription(lang: Lang, tpl: PhenomenonTemplate, marketDisplay: string): string {
  const t = tpl.i18n[lang];
  const state = STATE_COMMENTARY[lang][tpl.state];
  if (lang === 'fi') {
    return (
      `${t.summary}\n\n` +
      `Signaali markkinassa ${marketDisplay}: ${state}\n\n` +
      `Mitä tämä tarkoittaa kauppiaille: ${t.retailerImpact}`
    );
  }
  if (lang === 'sv') {
    return (
      `${t.summary}\n\n` +
      `Signal i ${marketDisplay}: ${state}\n\n` +
      `Vad detta betyder för handlare: ${t.retailerImpact}`
    );
  }
  return (
    `${t.summary}\n\n` +
    `Signal in ${marketDisplay}: ${state}\n\n` +
    `What this means for retailers: ${t.retailerImpact}`
  );
}

interface SotdCityBlock {
  city: string;
  body: string;
}

interface SotdSections {
  headline?: string;
  keyFindings?: string[];
  byCity?: SotdCityBlock[];
  alsoVisible?: string[];
  watching?: string[];
}

function buildSotdSections(
  lang: Lang,
  marketDisplay: string,
  picks: PhenomenonTemplate[],
): SotdSections {
  const [h, m, w] = picks;
  const hn = h.i18n[lang];
  const mn = m.i18n[lang];
  const wn = w.i18n[lang];
  const hState = STATE_NAME[lang][h.state];
  const mState = STATE_NAME[lang][m.state];
  const wState = STATE_NAME[lang][w.state];

  if (lang === 'fi') {
    return {
      headline: `${hn.label} — ${hState}`,
      keyFindings: [
        `${hn.label}: ${hn.summary}`,
        `${mn.label} on ${mState}; ${mn.summary}`,
        `${wn.label} pysyy ${wState} ja kannattaa pitää seurannassa.`,
      ],
      byCity: [
        {
          city: marketDisplay,
          body: hn.retailerImpact,
        },
      ],
      alsoVisible: [`${mn.label} (${mState}) — ${mn.retailerImpact}`],
      watching: [`${wn.label} (${wState})`],
    };
  }
  if (lang === 'sv') {
    return {
      headline: `${hn.label} — ${hState}`,
      keyFindings: [
        `${hn.label}: ${hn.summary}`,
        `${mn.label} är ${mState}; ${mn.summary}`,
        `${wn.label} förblir ${wState} och bör hållas under bevakning.`,
      ],
      byCity: [
        {
          city: marketDisplay,
          body: hn.retailerImpact,
        },
      ],
      alsoVisible: [`${mn.label} (${mState}) — ${mn.retailerImpact}`],
      watching: [`${wn.label} (${wState})`],
    };
  }
  return {
    headline: `${hn.label} — ${hState}`,
    keyFindings: [
      `${hn.label}: ${hn.summary}`,
      `${mn.label} is ${mState}; ${mn.summary}`,
      `${wn.label} remains ${wState} and is worth monitoring.`,
    ],
    byCity: [
      {
        city: marketDisplay,
        body: hn.retailerImpact,
      },
    ],
    alsoVisible: [`${mn.label} (${mState}) — ${mn.retailerImpact}`],
    watching: [`${wn.label} (${wState})`],
  };
}

function buildSotdNarrative(
  lang: Lang,
  marketDisplay: string,
  dateStr: string,
  picks: PhenomenonTemplate[],
): string {
  const [h, m, w] = picks;
  const hn = h.i18n[lang];
  const mn = m.i18n[lang];
  const wn = w.i18n[lang];
  const hState = STATE_NAME[lang][h.state];
  const mState = STATE_NAME[lang][m.state];
  const wState = STATE_NAME[lang][w.state];
  if (lang === 'fi') {
    return [
      `${marketDisplay} — päivittäinen katsaus (${dateStr}).`,
      ``,
      `Pääotsikko: ${hn.label} (${hState}). ${hn.summary} ${marketDisplay}n kauppiaille: ${hn.retailerImpact.charAt(0).toLowerCase()}${hn.retailerImpact.slice(1)}`,
      ``,
      `Myös liikkeellä: ${mn.label} on ${mState} — ${mn.summary}`,
      ``,
      `Seurannassa: ${wn.label} pysyy ${wState} ja kannattaa pitää silmällä kategoriasuunnittelun rinnalla tällä syklillä.`,
    ].join('\n');
  }
  if (lang === 'sv') {
    return [
      `${marketDisplay} — daglig översikt (${dateStr}).`,
      ``,
      `Rubrik: ${hn.label} (${hState}). ${hn.summary} För handlare i ${marketDisplay}: ${hn.retailerImpact.charAt(0).toLowerCase()}${hn.retailerImpact.slice(1)}`,
      ``,
      `Också i rörelse: ${mn.label} är ${mState} — ${mn.summary}`,
      ``,
      `Under bevakning: ${wn.label} förblir ${wState} och är värd att följa parallellt med kategoriplaneringen denna cykel.`,
    ].join('\n');
  }
  return [
    `${marketDisplay} — daily brief (${dateStr}).`,
    ``,
    `Headline: ${hn.label} (${hState}). ${hn.summary} For ${marketDisplay} retailers, ${hn.retailerImpact.charAt(0).toLowerCase()}${hn.retailerImpact.slice(1)}`,
    ``,
    `Also moving: ${mn.label} is ${mState} — ${mn.summary}`,
    ``,
    `Watch: ${wn.label} remains ${wState} and is worth monitoring alongside any category planning for this cycle.`,
  ].join('\n');
}

async function main() {
  console.log('Seeding demo markets…');
  for (const m of MARKETS) {
    await prisma.market.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
    console.log(`  ✓ Market: ${m.id}`);
  }

  for (const market of MARKETS) {
    console.log(`\nSeeding phenomena for ${market.id}…`);
    for (const [i, tpl] of PHENOMENA_TEMPLATES.entries()) {
      const phenId = `demo-${market.id}-${i}`;

      // Default English columns preserved for fallback and non-UI consumers.
      const description = buildDescription('en', tpl, market.displayName);

      // Structured i18n payload for the UI.
      const i18nPayload: Record<Lang, {
        label: string;
        summary: string;
        stateCommentary: string;
        retailerImpact: string;
        opportunity: string;
        description: string;
      }> = {
        en: {
          label: tpl.i18n.en.label,
          summary: tpl.i18n.en.summary,
          stateCommentary: STATE_COMMENTARY.en[tpl.state],
          retailerImpact: tpl.i18n.en.retailerImpact,
          opportunity: tpl.i18n.en.opportunity,
          description: buildDescription('en', tpl, market.displayName),
        },
        fi: {
          label: tpl.i18n.fi.label,
          summary: tpl.i18n.fi.summary,
          stateCommentary: STATE_COMMENTARY.fi[tpl.state],
          retailerImpact: tpl.i18n.fi.retailerImpact,
          opportunity: tpl.i18n.fi.opportunity,
          description: buildDescription('fi', tpl, market.displayName),
        },
        sv: {
          label: tpl.i18n.sv.label,
          summary: tpl.i18n.sv.summary,
          stateCommentary: STATE_COMMENTARY.sv[tpl.state],
          retailerImpact: tpl.i18n.sv.retailerImpact,
          opportunity: tpl.i18n.sv.opportunity,
          description: buildDescription('sv', tpl, market.displayName),
        },
      };

      const dateRange = STATE_DATE_RANGES[tpl.state];
      const seedKey = market.id.length * 7 + i * 13 + tpl.state.length;
      const firstSeenDaysAgo = pickInRange(
        seedKey,
        dateRange.firstSeenDays[0],
        dateRange.firstSeenDays[1],
      );
      const lastSignalDaysAgo = pickInRange(
        seedKey + 1,
        dateRange.lastSignalDays[0],
        dateRange.lastSignalDays[1],
      );

      await prisma.phenomenon.upsert({
        where: { id: phenId },
        update: {
          label: tpl.i18n.en.label,
          description,
          i18n: i18nPayload,
          firstSeenAt: daysAgo(firstSeenDaysAgo),
          lastSignalAt: daysAgo(lastSignalDaysAgo),
        },
        create: {
          id: phenId,
          label: tpl.i18n.en.label,
          description,
          primaryCountry: market.country,
          categories: tpl.categories,
          state: tpl.state as 'EMERGING' | 'ACCELERATING' | 'STABLE' | 'FADING' | 'DORMANT',
          keywords: tpl.keywords,
          centroid: [],
          footTrafficScope: 'regional',
          culturalScope: 'national',
          phenomenonType: 'TREND',
          lifecycleState: tpl.state === 'FADING' ? 'CONCLUDING' : 'ACTIVE',
          firstSeenAt: daysAgo(firstSeenDaysAgo),
          lastSignalAt: daysAgo(lastSignalDaysAgo),
          i18n: i18nPayload,
        },
      });

      // 14 days of scores
      for (let d = 13; d >= 0; d--) {
        const date = daysAgo(d);
        const dateStr = date.toISOString().split('T')[0];
        const base = 0.4 + (i % 5) * 0.08 + Math.random() * 0.1;
        const composite = Math.min(0.99, base + (13 - d) * 0.005);

        await prisma.phenomenonScore.upsert({
          where: {
            phenomenonId_marketId_date: {
              phenomenonId: phenId,
              marketId: market.id,
              date: new Date(dateStr),
            },
          },
          update: {},
          create: {
            phenomenonId: phenId,
            country: market.country,
            marketId: market.id,
            date: new Date(dateStr),
            volume: Math.floor(20 + Math.random() * 80),
            velocity: parseFloat((0.1 + Math.random() * 0.4).toFixed(3)),
            acceleration: parseFloat((-0.05 + Math.random() * 0.15).toFixed(3)),
            noiseAdjusted: parseFloat((composite - 0.02).toFixed(3)),
            sourceDiversity: parseFloat((0.3 + Math.random() * 0.5).toFixed(3)),
            compositeScore: parseFloat(composite.toFixed(3)),
            footTrafficScore: parseFloat((composite * market.footTrafficAxisWeight + Math.random() * 0.05).toFixed(3)),
            culturalScore: parseFloat((composite * market.culturalAxisWeight + Math.random() * 0.05).toFixed(3)),
            footTrafficProximity: parseFloat((0.3 + Math.random() * 0.5).toFixed(3)),
            culturalProximity: parseFloat((0.3 + Math.random() * 0.5).toFixed(3)),
            linkBoost: 0,
          },
        });
      }
      console.log(`  ✓ Phenomenon: ${tpl.i18n.en.label}`);
    }

    // 7 days of SignalOfTheDay — each day picks 3 trends and writes an analyst brief in all 3 languages.
    console.log(`\nSeeding signals-of-the-day for ${market.id}…`);
    for (let d = 6; d >= 0; d--) {
      const date = daysAgo(d);
      const dateStr = date.toISOString().split('T')[0];
      const pickIdx = [d % PHENOMENA_TEMPLATES.length, (d + 3) % PHENOMENA_TEMPLATES.length, (d + 7) % PHENOMENA_TEMPLATES.length];
      const picks = pickIdx.map((idx) => PHENOMENA_TEMPLATES[idx]);
      const topPhenomena = pickIdx.map((idx) => `demo-${market.id}-${idx}`);

      const narrativeByLang = Object.fromEntries(
        LANGS.map((lang) => [
          lang,
          {
            narrative: buildSotdNarrative(lang, market.displayName, dateStr, picks),
            sections: buildSotdSections(lang, market.displayName, picks),
          },
        ]),
      ) as Record<Lang, { narrative: string; sections: SotdSections }>;

      await prisma.signalOfTheDay.upsert({
        where: { marketId_date: { marketId: market.id, date: new Date(dateStr) } },
        update: {
          narrative: narrativeByLang.en.narrative,
          phenomenonIds: topPhenomena,
          i18n: JSON.parse(JSON.stringify(narrativeByLang)),
        },
        create: {
          marketId: market.id,
          country: market.country,
          date: new Date(dateStr),
          phenomenonIds: topPhenomena,
          narrative: narrativeByLang.en.narrative,
          i18n: JSON.parse(JSON.stringify(narrativeByLang)),
          publishedAt: date,
        },
      });
    }
    console.log(`  ✓ Signals of the day`);
  }

  console.log('\n✅ Demo seed complete.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
