import type { CompetitorExample, EvidenceClaim, PropertyActionRecommendation, PropertyActionsResponse, PropertyProfile } from './property-actions.js';

type LocalizedProperty = Partial<Pick<PropertyProfile, 'summary'>>;
type LocalizedClaim = Partial<Pick<EvidenceClaim, 'text' | 'metricUnit'>>;
type LocalizedCompetitor = Partial<Pick<CompetitorExample, 'observedMove' | 'whyItMatters'>>;
type LocalizedRecommendation = Partial<Pick<PropertyActionRecommendation, 'title' | 'expectedKpi' | 'whyNow' | 'action'>> & {
  competitorExamples?: Record<string, LocalizedCompetitor>;
};

interface LocalizationPack {
  properties: Record<string, LocalizedProperty>;
  recommendations: Record<string, LocalizedRecommendation>;
  claims: Record<string, LocalizedClaim>;
}

const FI: LocalizationPack = {
  properties: {
    'realidea-sello': {
      summary:
        'Alueellinen arjen asiointikeskus, jossa on laaja kaupan, palvelujen, terveyden, kauneuden ja vapaa-ajan kokonaisuus.',
    },
  },
  recommendations: {
    'sello-service-frequency': {
      title: 'Muuta palvelutarjonta viikoittaiseksi asiointirutiiniksi',
      expectedKpi:
        'Viikoittaiset aktiiviset kanta-asiakkaat, palvelukäyntien osuus ja uusintakäynnit',
      whyNow:
        'Sellolla on jo riittävä palvelujen ja arjen asioinnin leveys. Demoarvo syntyy siitä, että tarjonta tehdään mitattavaksi, ostettavaksi ja helposti löydettäväksi.',
      action:
        'Rakenna viikoittaiset asiointitehtävät: hyvinvointi ja kauneus, korjauspalvelut, perhearki, ruoka ja vapaa-aika. Nosta jokainen tunnin reitiksi, jossa on lähteisiin perustuva perustelu ja vuokralaisten tarjoukset.',
      competitorExamples: {
        'mall-of-america': {
          observedMove:
            'Käsittele elämykset, vähittäiskauppa ja brändikokemus yhtenä käyntijärjestelmänä.',
          whyItMatters:
            'Sello voi soveltaa samaa järjestelmäajattelua paikallisesti palveluihin ja viikoittaisiin rutiineihin.',
        },
      },
    },
  },
  claims: {
    'claim-sello-160-stores': {
      text:
        'Sello kertoo, että keskuksessa on yli 160 liikettä sekä laaja valikoima vapaa-ajan, terveyden ja kauneuden palveluja.',
      metricUnit: 'liikettä',
    },
    'claim-niq-health-beauty-growth': {
      text:
        'NIQ kuvaa terveyden ja kauneuden vuoden 2026 kuluttajanäkymässä vahvemmaksi sitoutumisen alueeksi, jossa ostotilanteet toistuvat johtavilla markkinoilla useammin.',
    },
    'claim-capgemini-value-2026': {
      text:
        'Capgeminin mukaan arvon kokemus rakentuu yhä enemmän läpinäkyvästä hinnoittelusta, laadusta, luottamuksesta, tunneyhteydestä ja tekoälyä hyödyntävistä ostamisen työkaluista.',
    },
    'claim-moa-flagship-experience': {
      text:
        'Mall of America asemoi lippulaivamyymälät elämyksellisiksi brändikokemuksiksi, joissa korostuvat erikoisvalikoimat, vuorovaikutteisuus ja uudistuminen.',
    },
  },
};

const LOCALIZATIONS: Record<string, LocalizationPack> = { fi: FI };

function languageKey(language?: string): string | null {
  const key = language?.toLowerCase().split(/[-_]/)[0];
  return key && LOCALIZATIONS[key] ? key : null;
}

export function localizePropertyActions(response: PropertyActionsResponse, language?: string): PropertyActionsResponse {
  const key = languageKey(language);
  if (!key) return response;

  const localization = LOCALIZATIONS[key];
  const propertyText = localization.properties[response.property.id];
  return {
    ...response,
    property: { ...response.property, ...propertyText },
    recommendations: response.recommendations.map((recommendation) => {
      const text = localization.recommendations[recommendation.id];
      if (!text) return recommendation;
      const { competitorExamples, ...fields } = text;
      return {
        ...recommendation,
        ...fields,
        competitorExamples: recommendation.competitorExamples.map((example) => ({
          ...example,
          ...competitorExamples?.[example.propertyId],
        })),
      };
    }),
    evidenceClaims: response.evidenceClaims.map((claim) => ({
      ...claim,
      ...localization.claims[claim.id],
    })),
  };
}
