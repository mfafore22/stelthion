import type { SignalOfTheDay } from '@stelthion/shoppermind-client-types';

const SIGNALS: Record<string, SignalOfTheDay> = {
  US: {
    id: 'static-us-2026-05',
    marketId: 'newyork-us',
    country: 'US',
    date: '2026-05-01',
    phenomenonIds: [
      'smart-value-low-risk',
      'frictionless-omnichannel',
      'retail-media-and-mall-attention',
      'health-beauty-wellness-frequency',
    ],
    narrative: 'US retail remains resilient, but mall demand is splitting into efficient value missions and experience-led destination visits.',
    publishedAt: '2026-05-02T00:00:00.000Z',
    i18n: {
      en: {
        narrative: 'US retail remains resilient, but mall demand is splitting into efficient value missions and experience-led destination visits.',
        sections: {
          headline: 'US malls should sell purpose: value, services, beauty, food, and measurable attention.',
          keyFindings: [
            'OECD projects US GDP growth of 2.0% in 2026 and 1.7% in 2027, while NRF forecasts 4.4% retail sales growth in 2026.',
            'U.S. Census data keeps e-commerce visible as a material part of retail, so physical centres must make the visit useful beyond browsing.',
            'Circana reports 2025 US beauty growth in both prestige and mass channels, making beauty and wellness credible frequency drivers.',
          ],
          byCity: [
            {
              city: 'Urban centre',
              body: 'Prioritise lunch, quick care, returns, pickup, beauty, and service bundles that convert office and transit flow into repeat visits.',
            },
            {
              city: 'Destination mall',
              body: 'Benchmark Mall of America-type assets on attractions, flagship stores, events, dwell time, and sponsorable retail-media inventory.',
            },
          ],
          alsoVisible: [
            'Retail media is a monetisation layer only if impressions, dwell, coupons, and sales lift can be reported.',
            'Value should be curated, not only discounted: visible offers, service bundles, and clear returns reduce purchase risk.',
          ],
          watching: [
            'Energy and inflation shocks that would shift discretionary trips toward value formats.',
            'Whether retail-media spend outside Amazon and Walmart can support mall-level inventory.',
          ],
        },
      },
      fi: {
        narrative: 'USA:n vähittäiskauppa pysyy sitkeänä, mutta kauppakeskuskysyntä jakautuu tehokkaisiin arvoasiointeihin ja elämyksellisiin kohdekäynteihin.',
        sections: {
          headline: 'USA:n kauppakeskuksen pitää myydä selkeä syy tulla: arvo, palvelut, kauneus, ruoka ja mitattava huomio.',
          keyFindings: [
            'OECD arvioi USA:n BKT-kasvuksi 2,0 % vuonna 2026 ja 1,7 % vuonna 2027; NRF ennustaa vähittäiskaupan kasvavan 4,4 % vuonna 2026.',
            'U.S. Censusin verkkokauppatilastot pitävät verkkokaupan selvästi mukana vähittäiskaupan kokonaiskuvassa, joten fyysisen käynnin pitää tarjota muutakin kuin selailua.',
            'Circana raportoi Yhdysvaltain kauneusmarkkinan kasvaneen 2025 sekä korkeamman hintaluokan että massamarkkinan tuotteissa. Kauneus ja hyvinvointi ovat siksi uskottavia käyntitiheyden ajureita.',
          ],
          byCity: [
            {
              city: 'Urbaani keskus',
              body: 'Nosta etusijalle lounas, nopeat terveyspalvelut, palautukset, nouto, kauneus ja palvelupaketit, jotka muuttavat toimisto- ja joukkoliikennevirran toistuviksi käynneiksi.',
            },
            {
              city: 'Kohdekeskus',
              body: 'Vertaa Mall of America -tyyppisiä kohteita vetonaulojen, lippulaivamyymälöiden, tapahtumien, viipymän ja sponsoroitavan kaupan median kautta.',
            },
          ],
          alsoVisible: [
            'Kaupan media toimii tulokerroksena vain, jos näyttökerrat, viipymä, kupongit ja myyntivaikutus raportoidaan.',
            'Arvon pitää olla kuratoitua, ei vain alennettua: näkyvät tarjoukset, palvelupaketit ja selkeät palautukset pienentävät ostoriskiä.',
          ],
          watching: [
            'Energia- ja inflaatiosokit, jotka siirtäisivät harkinnanvaraisia ostoskäyntejä edullisempiin asiointimuotoihin.',
            'Pystyykö Amazonin ja Walmartin ulkopuolinen kaupan media tukemaan kauppakeskustason mainospaikkoja.',
          ],
        },
      },
      sv: {
        narrative: 'USA:s detaljhandel är fortsatt motståndskraftig, men köpcentrums efterfrågan delar sig mellan effektiva värdebesök och upplevelsedrivna destinationer.',
        sections: {
          headline: 'Amerikanska köpcentrum bör sälja ett tydligt besökssyfte: värde, tjänster, skönhet, mat och mätbar uppmärksamhet.',
          keyFindings: [
            'OECD prognostiserar 2,0 % BNP-tillväxt i USA 2026 och 1,7 % 2027; NRF prognostiserar 4,4 % detaljhandelstillväxt 2026.',
            'U.S. Census data håller e-handeln synlig som en väsentlig del av detaljhandeln, så fysiska centrum måste göra besöket nyttigt utöver bläddring.',
            'Circana rapporterar beauty-tillväxt i USA 2025 i både prestige- och masskanaler, vilket gör beauty och wellness till trovärdiga frekvensdrivare.',
          ],
          byCity: [
            {
              city: 'Urbant centrum',
              body: 'Prioritera lunch, snabbvård, returer, hämtning, beauty och servicepaket som konverterar kontors- och transitflöde till återbesök.',
            },
            {
              city: 'Destination',
              body: 'Benchmarka Mall of America-liknande objekt på attraktioner, flaggskepp, event, vistelsetid och sponsringsbart retail media-inventarium.',
            },
          ],
          alsoVisible: [
            'Retail media är ett intäktslager bara om visningar, dwell, kuponger och försäljningslyft kan rapporteras.',
            'Värde bör vara kuraterat, inte bara rabatterat: synliga erbjudanden, servicepaket och tydliga returer minskar köprisken.',
          ],
          watching: [
            'Energi- och inflationschocker som skulle flytta sällanbesök mot värdeformat.',
            'Om retail media utanför Amazon och Walmart kan bära köpcentrumsinventarium.',
          ],
        },
      },
    },
    contributingSources: [
      { type: 'FRED', authority: 'authoritative', signalCount: 1, lastSignalAt: '2026-05-02T00:00:00.000Z' },
      { type: 'TRADE_PUB', authority: 'authoritative', signalCount: 4, lastSignalAt: '2026-05-02T00:00:00.000Z' },
    ],
  },
};

export function getStaticSignalOfMonth(country: string): SignalOfTheDay | null {
  return SIGNALS[country.toUpperCase()] ?? null;
}
