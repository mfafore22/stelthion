// Hand-curated distillation of EU_UAE_FIN_UStrendinsightsforplannin.{pdf,docx,rtf}
// (sibling files in this folder). Each row carries ≥2 cited sources from the
// research doc so the composite-source rule (project memory: never single-source;
// ≥2 verified strong sources required) is satisfied at seed time.
//
// Epoch: 2026-q1. When live fetchers (McKinsey, EuroCommerce, IGD, NRF, etc.)
// come online, real signals start corroborating these rows; recencyDecay in
// the confidence formula naturally lets live data take precedence.

import { TrendDomain } from '../../../src/engine/taxonomy/domains.js';

export type BootstrapState = 'EMERGING' | 'ACCELERATING' | 'STABLE' | 'FADING' | 'DORMANT';

export interface BootstrapSource {
  name: string;
  weight: number; // 0–1; ≥0.7 counts as "strong" for the composite-source gate.
  url: string;
  excerpt: string;
}

export interface BootstrapTrend {
  id: string;
  domain: TrendDomain;
  surprise: boolean;
  primaryCountry: string;
  label: { en: string; fi: string; sv: string };
  summary: { en: string; fi: string; sv: string };
  mallImpact: { en: string; fi: string; sv: string };
  groceryImpact: { en: string; fi: string; sv: string };
  // ISO country code → status. The seed script materialises a PhenomenonScore
  // for every Market whose `country` matches a key here (or whose region is
  // the EU when this carries an `EU` entry).
  marketStatus: Record<string, BootstrapState>;
  sources: BootstrapSource[];
  keywords: string[];
}

export const BOOTSTRAP_EPOCH = '2026-q1';

export const BOOTSTRAP_TRENDS: BootstrapTrend[] = [
  {
    id: 'value-polarization',
    domain: TrendDomain.VALUE_POLARIZATION,
    surprise: false,
    primaryCountry: 'DE',
    label: {
      en: 'Value polarization',
      fi: 'Arvopolarisaatio',
      sv: 'Värdepolarisering',
    },
    summary: {
      en: 'The "squeezed middle" is now structural. Consumers trade up in categories that matter to them and trade down in others — blanket mid-tier positioning is a losing strategy. Net premium intent rebounded from −5% in 2023 to +3% in 2026, led by millennials.',
      fi: 'Puristettu keskiluokka on nyt rakenteellinen ilmiö. Kuluttajat ostavat kalliimpaa heille tärkeissä kategorioissa ja säästävät muissa — yleinen keskihintainen positio ei enää toimi. Premium-ostohalukkuus nousi −5 %:sta (2023) +3 %:iin (2026), millenniaalien vetämänä.',
      sv: 'Den "klämda mellansegmentet" är nu strukturell. Konsumenter handlar dyrare i kategorier som betyder mycket och billigare i andra — generisk mellanprispositionering fungerar inte längre. Premiumköpvilja steg från −5 % (2023) till +3 % (2026), drivet av millennials.',
    },
    mallImpact: {
      en: 'Premium lifestyle and affordable-luxury anchors outperform mid-tier department stores; value fast-fashion grows alongside luxury boutiques.',
      fi: 'Premium-elämäntyylin ja edullisen luksuksen ankkurit pärjäävät keskihintaisia tavarataloja paremmin; edulliset pikamuotiketjut kasvavat luksusboutiquen rinnalla.',
      sv: 'Premium- och prisvärd-lyxankare presterar bättre än mellansegmentets varuhus; värde-fast fashion växer parallellt med lyxbutiker.',
    },
    groceryImpact: {
      en: 'Private label expands aggressively — over half of German shelf space may be own-brand by end 2026; promotions account for 21.9% of French FMCG revenue.',
      fi: 'Private label laajenee voimakkaasti — yli puolet Saksan hyllytilasta voi olla omaa merkkiä vuoden 2026 loppuun mennessä; tarjoukset kattavat 21,9 % Ranskan päivittäistavarakaupasta.',
      sv: 'Egna varumärken expanderar aggressivt — över hälften av tyska hyllor kan vara egna märken före slutet av 2026; kampanjer står för 21,9 % av Frankrikes dagligvaruomsättning.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'STABLE', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights', excerpt: 'Net premium purchase intent rebounded from −5% in 2023 to +3% in 2026, led by millennials.' },
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/european-grocery-trends-2026/', excerpt: 'German private-label shelf share approaching 50% by end 2026; French FMCG promotions at 21.9% of revenue.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: 'Premium and discount tenants outperform mid-market across major EU markets.' },
    ],
    keywords: ['value polarization', 'squeezed middle', 'trade up', 'trade down', 'premiumization', 'private label'],
  },
  {
    id: 'price-hypersensitivity',
    domain: TrendDomain.PRICE_HYPERSENSITIVITY,
    surprise: false,
    primaryCountry: 'DE',
    label: { en: 'Price hypersensitivity', fi: 'Hintaherkkyys', sv: 'Prishypersensitivitet' },
    summary: {
      en: 'Now a permanent behavioural shift, not an inflation reaction. 76% of EU households actively budget monthly vs. 51% in 2022; consumers haven\'t forgiven shrinkflation. German confidence remains below pre-pandemic norms even as food inflation falls to 1.2%.',
      fi: 'Pysyvä käyttäytymismuutos, ei enää inflaatioreaktio. 76 % EU-kotitalouksista budjetoi kuukausittain (vs. 51 % vuonna 2022); shrinkflaatiota ei ole annettu anteeksi. Saksan luottamus alle pandemiaa edeltäneen tason vaikka ruokainflaatio on laskenut 1,2 %:iin.',
      sv: 'Permanent beteendeskifte, inte längre en inflationsreaktion. 76 % av EU-hushållen budgeterar månadsvis (mot 51 % 2022); shrinkflation är inte glömt. Tysklands förtroende ligger under pre-pandemiska nivåer trots att livsmedelsinflationen sjunkit till 1,2 %.',
    },
    mallImpact: {
      en: 'Footfall at value/discount anchor stores outperforms full-price; mall operators diversifying away from pure retail toward F&B and services.',
      fi: 'Edullisten ja alennusliikkeiden kävijämäärät päihittävät täyshintaiset; ostoskeskukset siirtyvät pelkästä vähittäiskaupasta ravintoloihin ja palveluihin.',
      sv: 'Besöken till värdebutiker och rabattankare slår fullprisbutiker; köpcentrumoperatörer diversifierar bort från ren detaljhandel mot F&B och tjänster.',
    },
    groceryImpact: {
      en: 'Loyalty programs, price-matching, and multi-store hopping (avg. 3.5 chains/month) are now standard behaviour.',
      fi: 'Kanta-asiakasohjelmat, hintatakuut ja monimyymäläshoppailu (keskim. 3,5 ketjua/kk) ovat normaalia kuluttajakäyttäytymistä.',
      sv: 'Lojalitetsprogram, prismatchning och butikshoppande (i snitt 3,5 kedjor/månad) är nu standardbeteende.',
    },
    marketStatus: { EU: 'STABLE', FI: 'ACCELERATING', US: 'STABLE', AE: 'DORMANT', DE: 'STABLE', FR: 'STABLE', SE: 'STABLE' },
    sources: [
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: '76% of EU households actively budget monthly, up from 51% in 2022.' },
      { name: 'FirmEU', weight: 0.7, url: 'https://www.firmeu.com/insights/', excerpt: 'German consumer confidence remains below pre-pandemic norms despite food inflation easing.' },
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights', excerpt: 'Inflation shock changed habits structurally; basket-defense behaviour persists.' },
    ],
    keywords: ['price hypersensitivity', 'budgeting', 'shrinkflation', 'multi-store hopping'],
  },
  {
    id: 'convenience-food',
    domain: TrendDomain.CONVENIENCE_FOOD,
    surprise: false,
    primaryCountry: 'US',
    label: { en: 'Convenience food & food-to-go', fi: 'Convenience-ruoka ja take-away', sv: 'Bekvämlighetsmat & take-away' },
    summary: {
      en: 'Intent to buy ready-to-eat meals rose 2 pp YoY; 47% of Gen Z and 40% of millennials consume food-to-go weekly. Intent to cook from scratch dropped 4 pp among Gen Z in 2026. Foodservice outgrows grocery volume by 2 pp.',
      fi: 'Valmisruokien ostohalukkuus kasvoi 2 prosenttiyksikköä vuositasolla; 47 % Z-sukupolvesta ja 40 % milleniaaleista syö take-away-ruokaa viikoittain. Itse kokkaaminen putosi 4 pp Z-sukupolvella 2026. Foodservice kasvaa 2 pp nopeammin kuin päivittäistavarakauppa.',
      sv: 'Köpviljan för färdigmat steg 2 pp jämfört med året innan; 47 % av Gen Z och 40 % av millennials äter take-away veckovis. Viljan att laga från grunden föll 4 pp bland Gen Z 2026. Foodservice växer 2 pp snabbare än dagligvaror.',
    },
    mallImpact: {
      en: 'Food courts and fast-casual dining anchors become primary traffic drivers — not retail. Proximity-format stores with hot food gain share.',
      fi: 'Ruokakentät ja fast-casual-ravintolaketjut ovat tärkeimmät kävijävirtojen vetureita — eivät enää vähittäiskauppa. Lähikaupat, joissa on lämmin ruokatiski, kasvattavat osuuttaan.',
      sv: 'Food courts och fast-casual-ankare är nu primära besöksdrivare — inte detaljhandel. Närbutiker med varm mat tar marknadsandelar.',
    },
    groceryImpact: {
      en: 'Major reshuffling of floor space toward grab-and-go, hot deli, and meal kit sections; ready-to-eat is the fastest-growing category.',
      fi: 'Hyllytilan merkittävä uudelleenjärjestely grab-and-go-, kuumadeli- ja meal kit -osastoille; valmisruoka on nopeimmin kasvava kategoria.',
      sv: 'Omfattande omfördelning av hyllyta mot grab-and-go, varmdeli och meal kits; färdigmat är snabbast växande kategori.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights', excerpt: '47% of Gen Z and 40% of millennials consume food-to-go at least weekly.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: 'Foodservice outgrowing grocery volume by 2 pp; immediate-consumption products growing ~7%.' },
      { name: 'Mordor Intelligence', weight: 0.75, url: 'https://www.mordorintelligence.com/industry-reports/uae-food-and-grocery-retail-market', excerpt: 'Ready-to-eat among fastest-growing UAE segments; Dubai residents eat out ~3x/week.' },
    ],
    keywords: ['convenience food', 'food-to-go', 'ready-to-eat', 'meal kit', 'foodservice'],
  },
  {
    id: 'ai-shopping',
    domain: TrendDomain.AI_SHOPPING,
    surprise: false,
    primaryCountry: 'US',
    label: { en: 'AI in shopping', fi: 'Tekoäly ostosympäristössä', sv: 'AI i shoppingen' },
    summary: {
      en: '12% of EU consumers have already used AI in their grocery journey; 40% for meal planning, 37% for product research, 36% for price/recipe matching. Gen Z intent to increase AI use stands at 28% vs. 6% for boomers. 82% of consumers want to learn more about AI.',
      fi: '12 % EU-kuluttajista on jo käyttänyt tekoälyä ruokakauppakäynnillään; 40 % ateriasuunnitteluun, 37 % tuotetutkimukseen, 36 % hinta-/reseptivertailuun. Z-sukupolvi haluaa lisätä käyttöä 28 % vs. 6 % suuret ikäluokat. 82 % kuluttajista haluaa oppia tekoälystä lisää.',
      sv: '12 % av EU-konsumenter har redan använt AI i sin matshopping; 40 % för måltidsplanering, 37 % för produktforskning, 36 % för pris-/receptmatchning. Gen Z vill öka användningen 28 % mot 6 % för boomers. 82 % av konsumenter vill lära sig mer om AI.',
    },
    mallImpact: {
      en: 'Retail media networks (digital screens, data-driven ads) become a new revenue stream replacing declining rental income.',
      fi: 'Retail media -verkostot (digitaaliset näytöt, dataohjattu mainonta) tulevat uudeksi tulonlähteeksi laskevien vuokratulojen korvaajaksi.',
      sv: 'Retail media-nätverk (digitala skärmar, datadrivna annonser) blir ny intäktskälla som ersätter sjunkande hyresintäkter.',
    },
    groceryImpact: {
      en: 'AI enters shelf placement, dynamic pricing, and personalised loyalty. 30 of 40 dual-channel retailers score better online than in-store.',
      fi: 'Tekoäly siirtyy hyllysijoitteluun, dynaamiseen hinnoitteluun ja personoituun kanta-asiakasviestintään. 30/40 monikanavaisesta vähittäiskauppiaasta saa paremmat pisteet verkossa kuin myymälässä.',
      sv: 'AI flyttar in i hyllplacering, dynamisk prissättning och personaliserad lojalitet. 30 av 40 flerkanalsåterförsäljare presterar bättre online än i butik.',
    },
    marketStatus: { EU: 'EMERGING', FI: 'EMERGING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'EMERGING', FR: 'EMERGING', SE: 'EMERGING' },
    sources: [
      { name: 'IGD', weight: 0.85, url: 'https://www.igd.com/articles', excerpt: '12% of EU consumers used AI in grocery; 28% Gen Z intent to increase use.' },
      { name: 'NRF', weight: 0.85, url: 'https://nrf.com/research-insights', excerpt: '82% of consumers want to learn more about AI — adoption requires transparency and education.' },
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights', excerpt: 'Strong app retailers score significantly higher on satisfaction; 30/40 dual-channel score better online.' },
    ],
    keywords: ['ai shopping', 'agentic ai', 'retail media', 'dynamic pricing', 'personalisation'],
  },
  {
    id: 'hypermarket-decline',
    domain: TrendDomain.HYPERMARKET_DECLINE,
    surprise: false,
    primaryCountry: 'FR',
    label: { en: 'Hypermarket decline', fi: 'Hypermarkettien lasku', sv: 'Hypermarknadsnedgång' },
    summary: {
      en: 'French hypermarkets projected −0.5% in 2026; large-format grocery losing share structurally. Consumers favour formats that combine accessibility and efficiency.',
      fi: 'Ranskan hypermarketit ennustetaan laskevan −0,5 % vuonna 2026; suurmyymälämuoto menettää osuuttaan rakenteellisesti. Kuluttajat suosivat saavutettavuutta ja tehokkuutta yhdistäviä muotoja.',
      sv: 'Franska stormarknader förutspås −0,5 % 2026; stora dagligvaruformat förlorar strukturellt marknadsandelar. Konsumenter föredrar format som kombinerar tillgänglighet och effektivitet.',
    },
    mallImpact: {
      en: 'Mall-anchor hypermarkets face strategic pressure. Mixed-use redevelopment (residential, leisure, F&B) is filling the gap.',
      fi: 'Ostoskeskuksen ankkurihypermarketit ovat strategisessa puristuksessa. Sekakäyttörakentaminen (asuminen, vapaa-aika, ravintolat) täyttää aukkoa.',
      sv: 'Hypermarknadsankare i köpcentrum är under strategisk press. Blandanvändning (bostäder, fritid, F&B) fyller gapet.',
    },
    groceryImpact: {
      en: 'Big-box trips weaken relative to smaller, well-located stores with curated assortments.',
      fi: 'Suurmyymäläkäynnit heikkenevät pienempien, hyvällä paikalla sijaitsevien ja kuratoidun valikoiman omaavien myymälöiden hyväksi.',
      sv: 'Stormarknadsbesök försvagas till förmån för mindre, välpositionerade butiker med kuraterat sortiment.',
    },
    marketStatus: { EU: 'FADING', FI: 'FADING', US: 'STABLE', AE: 'STABLE', DE: 'FADING', FR: 'FADING', SE: 'FADING' },
    sources: [
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/french-grocery-formats-2026/', excerpt: 'French hypermarkets projected −0.5%; proximity stores +5.3%, drive-throughs +5.7% in 2026.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: 'Large anchors need more mixed-use support; consumers want faster missions.' },
      { name: 'CBRE', weight: 0.8, url: 'https://www.cbre.com/insights', excerpt: 'Mixed-use redevelopment filling the hypermarket-anchor gap in EU malls.' },
    ],
    keywords: ['hypermarket decline', 'big-box', 'mall anchor', 'mixed-use'],
  },
  {
    id: 'proximity-rise',
    domain: TrendDomain.PROXIMITY_RISE,
    surprise: false,
    primaryCountry: 'FR',
    label: { en: 'Proximity-store rise', fi: 'Lähikauppojen nousu', sv: 'Närbutikernas uppgång' },
    summary: {
      en: 'French proximity stores up +5.3% and drive-throughs up +5.7% in 2026. Consumers favour speed, location, and top-up trips.',
      fi: 'Ranskan lähikaupat +5,3 % ja drive-through-myymälät +5,7 % vuonna 2026. Kuluttajat suosivat nopeutta, sijaintia ja täydennysostoksia.',
      sv: 'Franska närbutiker +5,3 % och drive-through +5,7 % 2026. Konsumenter föredrar snabbhet, läge och kompletteringsbesök.',
    },
    mallImpact: {
      en: 'Drive-through and click-and-collect hubs are replacing traditional mall parking structures as retail infrastructure.',
      fi: 'Drive-through- ja noutoasemat korvaavat perinteisiä ostoskeskuksen pysäköintirakenteita osana vähittäiskaupan infraa.',
      sv: 'Drive-through och click-and-collect-hubbar ersätter traditionella parkeringsstrukturer som detaljhandelsinfrastruktur.',
    },
    groceryImpact: {
      en: 'Smaller stores, faster trips, curated ranges gain share. Neighbourhood and transit retail gain value.',
      fi: 'Pienemmät myymälät, nopeammat käynnit ja kuratoidut valikoimat kasvattavat osuuttaan. Asuinalue- ja joukkoliikennekauppa nostaa arvoaan.',
      sv: 'Mindre butiker, snabbare besök, kuraterade sortiment tar marknadsandelar. Närområdes- och transitbutiker stiger i värde.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/french-grocery-formats-2026/', excerpt: 'Proximity stores +5.3%, drive-throughs +5.7% in 2026.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: 'Consumers favour speed, location, and top-up trips.' },
    ],
    keywords: ['proximity store', 'drive-through', 'click-and-collect', 'small format'],
  },
  {
    id: 'health-functional-food',
    domain: TrendDomain.HEALTH_FUNCTIONAL_FOOD,
    surprise: false,
    primaryCountry: 'AE',
    label: { en: 'Health & functional food', fi: 'Terveys- ja toiminnalliset elintarvikkeet', sv: 'Hälsa & funktionell mat' },
    summary: {
      en: 'Protein, gut health, and mental well-being are top EU food-growth categories in 2026. 51% of US food shoppers plan to buy more better-for-you products. Functional beverage growth is at 7–8% in the UAE.',
      fi: 'Proteiini, suoliston terveys ja henkinen hyvinvointi ovat EU:n tärkeimmät kasvukategoriat 2026. 51 % yhdysvaltalaisista ruokaostajista aikoo ostaa enemmän paremmin sopivia tuotteita. Toiminnallisten juomien kasvu UAE:ssa 7–8 %.',
      sv: 'Protein, tarmhälsa och mental hälsa är topp EU-kategorier 2026. 51 % av amerikanska matkonsumenter planerar köpa mer hälsosamma produkter. Funktionella drycker växer 7–8 % i UAE.',
    },
    mallImpact: {
      en: 'Health-concept stores, supplement retailers, and active-lifestyle brands outperform conventional fashion tenants.',
      fi: 'Terveyskonsepti-myymälät, ravintolisien myyjät ja aktiivisen elämäntavan brändit pärjäävät perinteisiä muotiliikkeitä paremmin.',
      sv: 'Hälsokonceptbutiker, kosttillskottsåterförsäljare och aktiva-livsstilsmärken presterar bättre än traditionella modehyresgäster.',
    },
    groceryImpact: {
      en: 'Dedicated health-food aisles, nutraceutical ranges, and clear nutritional labelling are expanding. Active-food zones and health subscriptions emerging.',
      fi: 'Erilliset terveysruokahyllyt, nutraseuttiset tuotelinjat ja selkeät ravintomerkinnät laajenevat. Aktiivisen ruoan vyöhykkeitä ja terveyspaketteja syntyy.',
      sv: 'Dedikerade hälsoavdelningar, nutraceutiska sortiment och tydlig näringsmärkning expanderar. Aktiva matzoner och hälsoabonnemang uppkommer.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'Mintel', weight: 0.85, url: 'https://www.mintel.com/insights/', excerpt: 'GLP-1 + metabolic health drives accelerating health-food forecast.' },
      { name: 'Innova Market Insights', weight: 0.85, url: 'https://www.innovamarketinsights.com/trends/', excerpt: 'Protein, gut health and mental well-being top EU growth categories.' },
      { name: 'Mordor Intelligence', weight: 0.75, url: 'https://www.mordorintelligence.com/industry-reports/uae-food-and-grocery-retail-market', excerpt: 'Functional-beverage growth at 7–8% in the UAE.' },
    ],
    keywords: ['health food', 'functional food', 'protein', 'gut health', 'better-for-you'],
  },
  {
    id: 'sustainability',
    domain: TrendDomain.SUSTAINABILITY,
    surprise: false,
    primaryCountry: 'FI',
    label: { en: 'Sustainability (price-gated)', fi: 'Kestävyys (hintaehdoin)', sv: 'Hållbarhet (prisbegränsad)' },
    summary: {
      en: 'Consumer attitudes toward sustainability remain positive but fail to consistently convert to purchase. Finnish research confirms: positive attitude, price barriers limit action. Retailers pivot to "visible sustainability" — upcycling food waste, regenerative farming, sustainable packaging.',
      fi: 'Asenteet kestävyyttä kohtaan ovat positiiviset, mutta eivät muutu johdonmukaisesti ostokseksi. Suomalainen tutkimus vahvistaa: positiivinen asenne, hintaesteet rajoittavat tekoja. Vähittäiskauppa siirtyy "näkyvään kestävyyteen" — ruokahävikin kierrätykseen, regeneratiiviseen viljelyyn, kestäviin pakkauksiin.',
      sv: 'Attityder till hållbarhet förblir positiva men omsätts inte konsekvent i köp. Finsk forskning bekräftar: positiv attityd, prisbarriärer begränsar handling. Detaljhandeln går mot "synlig hållbarhet" — uppcycling av matsvinn, regenerativt jordbruk, hållbara förpackningar.',
    },
    mallImpact: {
      en: 'Green-building certifications and waste-reduction matter more to institutional mall owners (ESG compliance) than to shoppers directly.',
      fi: 'Vihreät rakennussertifikaatit ja hävikin vähentäminen ovat ostoskeskusten omistajille (ESG-vaatimukset) tärkeämpiä kuin suoraan kuluttajille.',
      sv: 'Gröna byggcertifieringar och avfallsreduktion betyder mer för institutionella köpcentrumsägare (ESG) än direkt för konsumenter.',
    },
    groceryImpact: {
      en: 'Clean-label and organic ranges grow within health-conscious segments but remain niche without subsidised pricing.',
      fi: 'Clean label- ja luomutuotteet kasvavat terveystietoisten segmenttien sisällä, mutta pysyvät niche-tuotteina ilman hintatukia.',
      sv: 'Clean label och ekologiskt växer inom hälsomedvetna segment men förblir nisch utan prissubventioner.',
    },
    marketStatus: { EU: 'STABLE', FI: 'STABLE', US: 'STABLE', AE: 'EMERGING', DE: 'STABLE', FR: 'STABLE', SE: 'STABLE' },
    sources: [
      { name: 'Theseus (Finnish research)', weight: 0.7, url: 'https://www.theseus.fi/', excerpt: 'Positive attitude toward sustainability, but price barriers consistently limit action.' },
      { name: 'IGD', weight: 0.85, url: 'https://www.igd.com/articles', excerpt: 'Visible sustainability — upcycling food waste, regenerative farming, sustainable packaging.' },
      { name: 'CBRE', weight: 0.8, url: 'https://www.cbre.com/insights', excerpt: 'Green-building certifications matter more to mall owners than shoppers directly.' },
    ],
    keywords: ['sustainability', 'clean label', 'regenerative', 'esg', 'circular'],
  },
  {
    id: 'ecommerce-grocery',
    domain: TrendDomain.ECOMMERCE_GROCERY,
    surprise: false,
    primaryCountry: 'FR',
    label: { en: 'E-commerce grocery', fi: 'Verkkoruokakauppa', sv: 'E-handel inom dagligvaror' },
    summary: {
      en: 'France reaches 13.3% of FMCG spending online (+2.8% in 2025). Online satisfaction beats in-store across 40 major European retailers. UAE e-commerce grocery has grown from ~2% (2019) to a significantly higher share by 2026. EU online grocery projected at €133.7B by 2027.',
      fi: 'Ranska saavuttaa 13,3 % päivittäistavaroiden verkkokaupasta (+2,8 % vuonna 2025). Verkkotyytyväisyys päihittää myymälän 40 suuressa eurooppalaisessa vähittäiskaupassa. UAE:n verkkoruokakauppa on kasvanut ~2 %:sta (2019) merkittävästi vuoteen 2026 mennessä. EU:n verkkoruokakauppa €133,7 mrd vuoteen 2027 mennessä.',
      sv: 'Frankrike når 13,3 % av dagligvaruköpen online (+2,8 % 2025). Online-nöjdhet slår butik hos 40 stora europeiska återförsäljare. UAE:s e-handel inom dagligvaror har vuxit från ~2 % (2019) betydligt till 2026. EU:s online-dagligvaror beräknas till €133,7 miljarder år 2027.',
    },
    mallImpact: {
      en: 'Drive-through and click-and-collect hubs are replacing traditional mall parking structures.',
      fi: 'Drive-through- ja noutoasemat korvaavat perinteisiä ostoskeskuksen pysäköintirakenteita.',
      sv: 'Drive-through och click-and-collect-hubbar ersätter traditionella parkeringsstrukturer.',
    },
    groceryImpact: {
      en: 'Omnichannel fulfilment (click-and-collect, dark stores, in-store picking) is now table stakes.',
      fi: 'Monikanavainen toimitus (nouto, dark store -varastot, myymäläkeräily) on perusvaatimus.',
      sv: 'Flerkanals-fulfilment (click-and-collect, dark stores, in-store-plockning) är nu standard.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'Bagason / Yahoo Finance', weight: 0.7, url: 'https://finance.yahoo.com/news/eu-online-grocery-2027/', excerpt: 'EU online grocery projected at €133.7B by 2027.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: '6.8% online sales growth in 2025; convenience and delivery expectations keep rising.' },
      { name: 'Adat', weight: 0.7, url: 'https://www.adat.ae/insights/', excerpt: 'UAE e-commerce grocery share materially higher in 2026 vs. 2019 baseline.' },
    ],
    keywords: ['ecommerce grocery', 'online grocery', 'dark store', 'click and collect', 'omnichannel'],
  },
  {
    id: 'glp1-effect',
    domain: TrendDomain.GLP1_EFFECT,
    surprise: true,
    primaryCountry: 'US',
    label: { en: 'GLP-1 / Ozempic effect on grocery', fi: 'GLP-1- / Ozempic-vaikutus ruokaostoksiin', sv: 'GLP-1 / Ozempic-effekten på dagligvaror' },
    summary: {
      en: 'GLP-1 weight-loss drug users reduce grocery spend ~6% within 6 months — biggest cuts in savoury snacks, sweet bakery, biscuits. Reuters projects $12B decline in US snack sales tied to GLP-1. Counterintuitive: GLP-1 users shop more in-store, not online — body changes mean they need to physically try on clothes.',
      fi: 'GLP-1-laihdutuslääkkeen käyttäjät vähentävät ruokaostoksia ~6 % puolessa vuodessa — suurimmat leikkaukset suolaisissa naposteltavissa, makeissa leivonnaisissa ja kekseissä. Reuters arvioi $12 mrd laskua Yhdysvaltain naposteltavien myynnissä. Vastoin odotuksia: käyttäjät käyvät myymälöissä enemmän kuin verkossa — kehon muutokset pakottavat sovittamaan vaatteet paikan päällä.',
      sv: 'GLP-1-användare minskar dagligvaruköp ~6 % på sex månader — största nedskärningarna i salta snacks, söta bakverk, kex. Reuters projicerar $12 miljarder i nedgång för amerikansk snackförsäljning. Kontraintuitivt: GLP-1-användare handlar mer i butik än online — kroppsförändringar gör att de måste prova kläder fysiskt.',
    },
    mallImpact: {
      en: 'Unexpected tailwind for physical retail — GLP-1 users shop more in-store because body changes require physical fitting. Apparel and beauty may benefit.',
      fi: 'Yllättävä myötätuuli kivijalkakaupalle — käyttäjät käyvät myymälöissä koska kehon muutokset vaativat fyysistä sovittamista. Vaate- ja kauneuskategoriat voivat hyötyä.',
      sv: 'Oväntad medvind för fysisk handel — GLP-1-användare handlar mer i butik då kroppsförändringar kräver fysisk provning. Kläder och skönhet kan gynnas.',
    },
    groceryImpact: {
      en: 'Smaller baskets, less dessert/alcohol, more produce/protein, more portion control. Retailers shifting shelf space toward protein and fibre.',
      fi: 'Pienemmät korit, vähemmän jälkiruokia ja alkoholia, enemmän tuoretuotteita ja proteiinia, enemmän annoshallintaa. Vähittäiskauppa siirtää hyllytilaa proteiineihin ja kuituihin.',
      sv: 'Mindre korgar, mindre dessert/alkohol, mer frukt-grönt/protein, mer portionskontroll. Återförsäljare flyttar hyllyta mot protein och fiber.',
    },
    marketStatus: { EU: 'EMERGING', FI: 'EMERGING', US: 'ACCELERATING', AE: 'DORMANT', DE: 'EMERGING', FR: 'EMERGING', SE: 'EMERGING' },
    sources: [
      { name: 'Reuters', weight: 0.9, url: 'https://www.reuters.com/business/healthcare-pharmaceuticals/', excerpt: 'GLP-1 medications could contribute to a $12B decline in snack sales.' },
      { name: 'NEPA', weight: 0.7, url: 'https://www.nepa.com/insights/', excerpt: 'GLP-1 users reduce grocery spend ~6% within 6 months; biggest cuts in savoury snacks and biscuits.' },
      { name: 'Grocery Dive', weight: 0.75, url: 'https://www.grocerydive.com/topic/private-label/', excerpt: 'Counterintuitive in-store tailwind: body changes mean GLP-1 users physically try on clothes.' },
    ],
    keywords: ['glp-1', 'ozempic', 'wegovy', 'weight-loss drug', 'snack decline', 'protein shift'],
  },
  {
    id: 'non-alcoholic-bev',
    domain: TrendDomain.NON_ALCOHOLIC_BEV,
    surprise: true,
    primaryCountry: 'DE',
    label: { en: 'Non-alcoholic beverage boom', fi: 'Alkoholittomien juomien nousu', sv: 'Boom för alkoholfria drycker' },
    summary: {
      en: 'Alcoholic beverages −0.5% in Germany while non-alcoholic alternatives and soft drinks +2.7%. Structural generational shift, not a health fad — playing out across all EU markets.',
      fi: 'Alkoholijuomat −0,5 % Saksassa, samalla kun alkoholittomat vaihtoehdot ja virvoitusjuomat +2,7 %. Rakenteellinen sukupolvimuutos, ei terveysmuoti — toistuu koko EU:ssa.',
      sv: 'Alkoholhaltiga drycker −0,5 % i Tyskland, medan alkoholfria alternativ och läsk +2,7 %. Strukturellt generationsskifte — inget hälsotrendmod — spelar ut sig över hela EU.',
    },
    mallImpact: {
      en: 'Mocktail bars and alcohol-free beverage concept stores emerging as F&B differentiators in experiential mall mixes.',
      fi: 'Mocktail-baarit ja alkoholittomat juomakonseptit nousevat F&B-erottautumistekijöiksi elämysorientoituneissa ostoskeskuksissa.',
      sv: 'Mocktailbarer och alkoholfria dryckeskoncept dyker upp som F&B-differentierare i upplevelseinriktade köpcentrum.',
    },
    groceryImpact: {
      en: 'Dedicated non-alc shelf zones expanding; premium-priced AF beer/wine becoming structural category, not seasonal.',
      fi: 'Erityiset alkoholittomien hyllyalueet laajenevat; premium-hintaiset alkoholittomat oluet ja viinit muuttuvat pysyväksi kategoriaksi, eivät enää sesonkituotteeksi.',
      sv: 'Dedikerade hyllområden för alkoholfritt växer; premiumprissatt AF-öl/-vin blir strukturell kategori, inte säsongsbaserad.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/non-alcoholic-beverages-2026/', excerpt: 'Alcoholic beverages −0.5% in Germany while non-alcoholic alternatives +2.7%.' },
      { name: 'EuroCommerce', weight: 0.85, url: 'https://www.eurocommerce.eu/category/publications/', excerpt: 'Generational shift locks in non-alcoholic as a mainstream category.' },
    ],
    keywords: ['non-alcoholic', 'mocktail', 'sober curious', 'alcohol-free'],
  },
  {
    id: 'experiential-retail',
    domain: TrendDomain.EXPERIENTIAL_RETAIL,
    surprise: false,
    primaryCountry: 'AE',
    label: { en: 'Experiential retail / mall', fi: 'Elämysvähittäiskauppa', sv: 'Upplevelsedetaljhandel' },
    summary: {
      en: 'Physical retail wins when it acts as a destination and third place rather than transaction point. Dubai 3-Day Super Sale drove 36% sales uplifts; experience-led malls dominate UAE format. WGSN: 54% of consumers want joy when shopping online; fully connected customers 52% more valuable.',
      fi: 'Kivijalkakauppa voittaa toimimalla kohteena ja "kolmantena tilana", ei pelkkänä transaktiopaikkana. Dubain 3-Day Super Sale nosti myyntiä 36 %; elämyskeskeiset ostoskeskukset hallitsevat UAE-formaattia. WGSN: 54 % kuluttajista haluaa iloa verkko-ostoksilta; täysin sitoutuneet asiakkaat 52 % arvokkaampia.',
      sv: 'Fysisk handel vinner när den fungerar som destination och tredje plats snarare än transaktionspunkt. Dubai 3-Day Super Sale drev 36 % försäljningsuppgång; upplevelseledda köpcentrum dominerar UAE-formatet. WGSN: 54 % av konsumenter vill ha glädje vid online-shopping; fullt anslutna kunder 52 % mer värdefulla.',
    },
    mallImpact: {
      en: 'Indoor malls benefit most when they add entertainment, immersive tenants, and longer dwell-time experiences. Anchor shifts from department store to entertainment/dining.',
      fi: 'Sisäostoskeskukset hyötyvät eniten lisäämällä viihdettä, immersiivisiä vuokralaisia ja pidempiä viipymäaikoja. Ankkuri siirtyy tavaratalosta viihteeseen ja ravintoloihin.',
      sv: 'Inomhus-köpcentrum gynnas mest när de lägger till underhållning, immersiva hyresgäster och längre vistelseupplevelser. Ankaret skiftar från varuhus till underhållning/restaurang.',
    },
    groceryImpact: {
      en: 'Grocery benefits indirectly through co-location with dining and service ecosystems; in-store cafés and curated specialty sections gain.',
      fi: 'Päivittäistavarakauppa hyötyy epäsuorasti sijoittuessaan ravintoloiden ja palveluekosysteemien viereen; myymäläkahvilat ja kuratoidut erikoisosastot kasvattavat osuuttaan.',
      sv: 'Dagligvaror gynnas indirekt genom samlokalisering med restaurang- och serviceekosystem; in-store-kaféer och kuraterade specialavdelningar vinner.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'EMERGING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'WGSN Future Consumer', weight: 0.85, url: 'https://www.wgsn.com/en/insights/future-consumer', excerpt: '54% of consumers want a feeling of joy when shopping online; fully connected customers 52% more valuable.' },
      { name: 'TasOutsourcing', weight: 0.7, url: 'https://www.tasoutsourcing.com/insights/', excerpt: 'Social commerce + content-first retail accelerating experiential mall format.' },
      { name: 'NRF', weight: 0.85, url: 'https://nrf.com/research-insights', excerpt: 'Modern centres built around entertainment, dining, immersive brand experiences.' },
    ],
    keywords: ['experiential retail', 'third place', 'discovery shopping', 'phygital', 'mall events'],
  },
  {
    id: 'challenger-brands',
    domain: TrendDomain.CHALLENGER_BRANDS,
    surprise: true,
    primaryCountry: 'US',
    label: { en: 'Challenger brands beat legacy', fi: 'Haastajabrändit ohittavat suuret', sv: 'Utmanarvarumärken slår etablerade' },
    summary: {
      en: '2026 is shaping up as the "Year of the Challenger Brand." Speed, authenticity, and flavour-forward innovation outperform legacy brand marketing spend in grocery. Smaller, regional M&A replaces mega-mergers as consolidation strategy.',
      fi: 'Vuodesta 2026 muodostuu "haastajabrändien vuosi". Nopeus, autenttisuus ja makukeskeinen innovaatio päihittävät perinteisten brändien markkinointibudjetit ruokakaupoissa. Pienemmät, alueelliset yritysjärjestelyt korvaavat suursulautumiset.',
      sv: 'År 2026 formar sig som "utmanarvarumärkenas år". Hastighet, autenticitet och smakdrivet innovation slår etablerade märkens marknadsföring inom dagligvaror. Mindre, regionala M&A ersätter megasammangåenden.',
    },
    mallImpact: {
      en: 'DTC and challenger brand pop-ups gain mall tenancy share over legacy retailers; flexible-lease formats matter.',
      fi: 'DTC- ja haastajabrändien pop-up-myymälät kasvattavat osuuttaan ostoskeskuksen vuokralaisina perinteisten vähittäiskauppiaiden kustannuksella; joustavat vuokrasopimukset korostuvat.',
      sv: 'DTC och utmanarmärkenas pop-ups tar köpcentrumandelar från etablerade återförsäljare; flexibla hyresformat blir viktigare.',
    },
    groceryImpact: {
      en: 'New product launches need stronger value, health, or functional hooks to break through. Speed-to-shelf becomes the new competitive moat.',
      fi: 'Uudet tuotelanseeraukset tarvitsevat vahvempaa arvolupausta, terveys- tai toiminnallista koukkua läpimurtoon. Hyllynopeus on uusi kilpailuetu.',
      sv: 'Nya produktlanseringar behöver starkare värde-, hälso- eller funktionella krokar för att slå igenom. Tid-till-hylla är den nya konkurrensvallgraven.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'EMERGING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'EMERGING' },
    sources: [
      { name: 'LinkedIn (industry analysis)', weight: 0.7, url: 'https://www.linkedin.com/pulse/year-of-the-challenger-brand-2026', excerpt: 'Speed and authenticity outperform legacy brand marketing spend.' },
      { name: 'YouTube (industry talks)', weight: 0.65, url: 'https://www.youtube.com/results?search_query=challenger+brand+grocery+2026', excerpt: 'Smaller regional M&A replacing mega-mergers as the consolidation strategy.' },
      { name: 'IGD', weight: 0.85, url: 'https://www.igd.com/articles', excerpt: '74-26 split between repeat and new-trial grocery purchases — challenger products must hook hard.' },
    ],
    keywords: ['challenger brand', 'dtc', 'speed to shelf', 'flavor-forward'],
  },
  {
    id: 'retail-concentration',
    domain: TrendDomain.RETAIL_CONCENTRATION,
    surprise: true,
    primaryCountry: 'FI',
    label: { en: 'Retail concentration tightening', fi: 'Vähittäiskaupan keskittymä tiivistyy', sv: 'Detaljhandelns koncentration skärps' },
    summary: {
      en: 'Top-5 European retailers strengthening grip across all EU markets studied — squeezing mid-tier and independent grocers out. Finland: K Group (33.5%) + S Group jointly control >80%. Reshapes mall tenancy mix.',
      fi: 'Viiden suurimman eurooppalaisen vähittäiskauppiaan ote tiukentuu kaikilla tutkituilla EU-markkinoilla — keskikokoisia ja itsenäisiä ruokakauppoja syrjäytetään. Suomi: K-ryhmä (33,5 %) + S-ryhmä hallitsevat yhdessä yli 80 %. Muotoilee ostoskeskusten vuokralaiskokoonpanoa.',
      sv: 'Topp-5-europeiska återförsäljare stärker greppet i alla studerade EU-marknader — pressar mellansegmentet och oberoende handlare ut. Finland: K-Gruppen (33,5 %) + S-Gruppen kontrollerar tillsammans >80 %. Omformar köpcentrumens hyresgästmix.',
    },
    mallImpact: {
      en: 'Mall tenant negotiating power skews further toward top-5 anchor groups; independent specialty tenants squeezed.',
      fi: 'Ostoskeskuksen vuokralaisten neuvotteluvoima keskittyy viiden suurimman ankkuriryhmittymän käsiin; itsenäiset erikoismyymälät puristuksessa.',
      sv: 'Köpcentrumshyresgästers förhandlingsstyrka skiftar ytterligare mot topp-5-ankargrupper; oberoende specialhyresgäster pressas.',
    },
    groceryImpact: {
      en: 'Pricing leverage, private-label scale, and retail-media inventory consolidate to a handful of operators; brands must accept those terms or exit.',
      fi: 'Hinnoitteluvipu, private label -skaala ja retail media -inventaario keskittyy harvoille toimijoille; brändien on hyväksyttävä ehdot tai poistuttava.',
      sv: 'Prishävstång, egna-märkesskala och retail-media-inventory konsolideras till en handfull aktörer; varumärken måste acceptera villkoren eller dra sig ur.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'STABLE', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/european-retail-concentration-2026/', excerpt: 'Top-5 European retailers strengthening grip across all EU markets studied.' },
      { name: 'Kesko Investor Reports', weight: 0.85, url: 'https://www.kesko.fi/en/investor/', excerpt: 'K Group 33.5% Finnish grocery share for 2025; market gain in H2.' },
      { name: 'Inderes', weight: 0.7, url: 'https://www.inderes.fi/en/', excerpt: 'Finnish duopoly K Group + S Group jointly control over 80% of grocery market.' },
    ],
    keywords: ['retail concentration', 'top-5 retailers', 'duopoly', 'consolidation'],
  },
  {
    id: 'genz-physical-return',
    domain: TrendDomain.GENZ_PHYSICAL_RETURN,
    surprise: true,
    primaryCountry: 'US',
    label: { en: 'Gen Z returning to physical stores', fi: 'Z-sukupolvi palaa kivijalkamyymälöihin', sv: 'Gen Z återvänder till fysiska butiker' },
    summary: {
      en: 'Counter-narrative: over 2 in 5 Gen Z globally still prefer in-store shopping — figure has held since 2020 despite digital growth. Driven by discovery culture: physical stores as social and content-creation environments, not transaction points. 66% of Zalphas prioritise spending time with friends.',
      fi: 'Vastoin yleistä kertomusta: yli 2/5 Z-sukupolvesta suosii edelleen kivijalkaostamista — luku on pysynyt vuodesta 2020 huolimatta digitaalisesta kasvusta. Ajaa löytökulttuuri: fyysiset myymälät sosiaalisina ja sisällöntuotannon ympäristöinä, eivät transaktiopaikkoina. 66 % Z-alfista pitää tärkeänä viettää aikaa ystävien kanssa.',
      sv: 'Kontranarrativ: över 2 av 5 Gen Z globalt föredrar fortfarande butiksshopping — siffran har stått stabilt sedan 2020 trots digital tillväxt. Drivs av upptäcktskultur: fysiska butiker som sociala och innehållsproduktionsmiljöer, inte transaktionspunkter. 66 % av Zalphas prioriterar tid med vänner.',
    },
    mallImpact: {
      en: 'Massive opportunity for malls that lean into social-discovery, content-creation tenants, and event-led programming. Indoor climate-controlled malls especially.',
      fi: 'Merkittävä mahdollisuus ostoskeskuksille, jotka panostavat sosiaaliseen löytämiseen, sisällöntuottajavuokralaisiin ja tapahtumaohjelmaan. Erityisesti sisäilmastoidut ostoskeskukset.',
      sv: 'Enorm möjlighet för köpcentrum som lutar mot social upptäckt, innehållsskapande hyresgäster och evenemangsprogrammering. Särskilt inomhus-klimatreglerade.',
    },
    groceryImpact: {
      en: 'Grab-and-go and content-friendly grocery formats (visually stunning produce, viral product tie-ins) gain Gen Z mindshare.',
      fi: 'Grab-and-go- ja somefriendly-päivittäistavaraformaatit (näyttävät tuoretuotteet, viraalit tuotelinkit) saavat Z-sukupolven huomion.',
      sv: 'Grab-and-go och innehållsvänliga dagligvaruformat (visuellt slående grönsaker, virala produktkopplingar) vinner Gen Z-mindshare.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'EMERGING', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'GWI', weight: 0.85, url: 'https://www.gwi.com/connecting-the-dots', excerpt: 'Over 2 in 5 Gen Z globally still prefer in-store shopping — held steady since 2020.' },
      { name: 'NRF', weight: 0.85, url: 'https://nrf.com/research-insights', excerpt: 'Younger consumers harder to win through digital ads; physical retail for discovery and social activity.' },
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/retail/our-insights', excerpt: 'Anchor shifting from department stores to experience/dining/entertainment concepts.' },
    ],
    keywords: ['gen z', 'in-store discovery', 'social shopping', 'content creation'],
  },
  {
    id: 'premiumization',
    domain: TrendDomain.PREMIUMIZATION,
    surprise: false,
    primaryCountry: 'US',
    label: { en: 'Selective premiumisation', fi: 'Valikoiva premiumisaatio', sv: 'Selektiv premiumisering' },
    summary: {
      en: 'Premium is back, but only selectively. Net premium intent rebounded from −5% (2023) to +3% (2026), led by millennials. Beauty market projected at $580B globally by 2027 (+6% annually). UAE: high-income expats drive demand for organic/clean-label.',
      fi: 'Premium on takaisin, mutta valikoivasti. Premium-ostohalukkuus nousi −5 %:sta (2023) +3 %:iin (2026), millenniaalien vetämänä. Kauneuskategoria $580 mrd globaalisti vuoteen 2027 mennessä (+6 %/vuosi). UAE: korkeatuloiset ulkomaalaiset luovat kysyntää luomulle ja clean-labelille.',
      sv: 'Premium är tillbaka — men selektivt. Premiumköpvilja steg från −5 % (2023) till +3 % (2026), drivet av millennials. Skönhetsmarknaden beräknas till $580 miljarder globalt 2027 (+6 %/år). UAE: höginkomstexpater driver efterfrågan på ekologiskt/clean-label.',
    },
    mallImpact: {
      en: 'Affordable-luxury and premium-lifestyle anchors outperform mid-tier; halal and trust-led signalling especially relevant in UAE.',
      fi: 'Edullisen luksuksen ja premium-elämäntyylin ankkurit pärjäävät keskihintaisia paremmin; halal- ja luottamusviestintä erityisen tärkeää UAE:ssa.',
      sv: 'Prisvärd-lyx- och premium-livsstilsankare presterar bättre än mellansegment; halal och förtroendebaserad signalering särskilt relevant i UAE.',
    },
    groceryImpact: {
      en: 'Selective premium ladders (organic, clean-label, premium private label) keep their place; broad mid-market premium dies.',
      fi: 'Valikoivat premium-portaat (luomu, clean label, premium private label) säilyttävät paikkansa; laaja keskitason premium kuolee.',
      sv: 'Selektiva premium-stegar (ekologiskt, clean-label, premium-egna märken) håller sin plats; bred mellansegments-premium dör.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'STABLE', US: 'ACCELERATING', AE: 'ACCELERATING', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'STABLE' },
    sources: [
      { name: 'McKinsey ConsumerWise', weight: 0.9, url: 'https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights', excerpt: 'Net premium intent rebounded from −5% to +3%; beauty market $580B by 2027 at ~6% annual growth.' },
      { name: 'Mordor Intelligence', weight: 0.75, url: 'https://www.mordorintelligence.com/industry-reports/uae-food-and-grocery-retail-market', excerpt: 'High-income UAE expats drive organic/clean-label demand; halal certification amplifies trust.' },
      { name: 'YouGov', weight: 0.7, url: 'https://yougov.com/topics/retail', excerpt: 'Premium and value retailers outperform; mid-market loses ground.' },
    ],
    keywords: ['premiumization', 'affordable luxury', 'beauty premium', 'halal premium'],
  },
  {
    id: 'private-label',
    domain: TrendDomain.PRIVATE_LABEL,
    surprise: false,
    primaryCountry: 'US',
    label: { en: 'Private-label dominance', fi: 'Private label -valta-asema', sv: 'Eget-varumärkes-dominans' },
    summary: {
      en: '44% of US shoppers buying more store brands; 88% plan to maintain or increase private-label purchases in 2026. 61% trust private-label food quality. Germany: over half of shelf space may be own-brand by end 2026. Price > brand name for 62% of US shoppers.',
      fi: '44 % yhdysvaltalaisista ostaa enemmän kauppojen omia merkkejä; 88 % aikoo säilyttää tai kasvattaa private label -ostoja 2026. 61 % luottaa private label -ruoan laatuun. Saksa: yli puolet hyllytilasta voi olla omaa merkkiä vuoden 2026 loppuun mennessä. Hinta > brändi 62 %:lle yhdysvaltalaisista.',
      sv: '44 % av amerikanska konsumenter köper mer egna märken; 88 % planerar bibehålla eller öka egna-märkesköp 2026. 61 % litar på egna märkens matkvalitet. Tyskland: över hälften av hyllytan kan vara egna märken före slutet av 2026. Pris > varumärke för 62 % av amerikanska konsumenter.',
    },
    mallImpact: {
      en: 'Indirect: discount and value-anchored centres benefit; mid-market traditional retail tenants lose negotiating leverage.',
      fi: 'Epäsuora vaikutus: edulliset ja value-ankkuriset keskukset hyötyvät; keskitason perinteiset vähittäiskaupan vuokralaiset menettävät neuvotteluvoimaa.',
      sv: 'Indirekt: rabatt- och värdeankrade centrum gynnas; mellanskiktsbutiker tappar förhandlingsstyrka.',
    },
    groceryImpact: {
      en: 'Store brands gain trust, especially in food. Retailers push good-better-best private label tiers; national brands face permission-to-grow gap.',
      fi: 'Kauppojen omat merkit saavuttavat luottamuksen, erityisesti ruoassa. Vähittäiskauppa työntää good-better-best private label -portaat; kansainväliset brändit kohtaavat kasvuoikeuden.',
      sv: 'Egna märken vinner förtroende, särskilt inom mat. Återförsäljare driver good-better-best-egna-märkesnivåer; nationella märken möter "tillstånd-att-växa"-gap.',
    },
    marketStatus: { EU: 'ACCELERATING', FI: 'ACCELERATING', US: 'ACCELERATING', AE: 'STABLE', DE: 'ACCELERATING', FR: 'ACCELERATING', SE: 'ACCELERATING' },
    sources: [
      { name: 'Supermarket News', weight: 0.85, url: 'https://www.supermarketnews.com/private-label', excerpt: '44% of US shoppers buying more store brands; 88% maintain or increase in 2026; 61% trust private-label food quality.' },
      { name: 'IntoTheMinds', weight: 0.75, url: 'https://www.intotheminds.com/blog/en/european-grocery-trends-2026/', excerpt: 'German private-label shelf share approaching 50% by end 2026.' },
      { name: 'Kaizen Brand Evolution', weight: 0.7, url: 'https://www.kaizenbrandevolution.com/insights', excerpt: 'Price matters more than brand name for 62% of US shoppers.' },
    ],
    keywords: ['private label', 'store brand', 'good-better-best', 'own brand'],
  },
];
