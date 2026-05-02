import {
  getCuratedTrends,
  getCuratedTrendsByHorizon,
  getMegaScenario,
  getMallScenarioStress,
} from '@/lib/shoppermind/megaScenario';
import { getStaticSignalOfMonth } from '@/lib/shoppermind/staticSignals';

describe('ShopperMind content integrity', () => {
  const marketCountries = ['FI', 'SE', 'US'] as const;
  const displayLanguages = ['fi', 'sv', 'en'] as const;

  it('has scenario stress data for every selectable property in supported country scenarios', () => {
    for (const country of marketCountries) {
      const scenario = getMegaScenario(country, 'en', null);
      if (!scenario || scenario.placeholder) continue;
      for (const option of scenario.perMallOptions) {
        expect(getMallScenarioStress(option.id, 'en')).toBeTruthy();
      }
    }
  });

  it('renders each supported local market in Finnish, Swedish and English without changing market', () => {
    for (const country of marketCountries) {
      for (const language of displayLanguages) {
        const scenario = getMegaScenario(country, language, null);
        const curated = getCuratedTrends(country, language, scenario?.perMallOptions[0]?.id ?? null);

        expect(scenario?.country).toBe(country);
        expect(scenario?.title).toBeTruthy();
        expect(scenario?.intro).toBeTruthy();
        expect(scenario?.sources.length).toBeGreaterThan(0);
        for (const source of scenario?.sources ?? []) {
          expect(source.title).toBeTruthy();
        }

        expect(curated.length).toBeGreaterThan(0);
        for (const trend of curated) {
          expect(trend.countries).toContain(country);
          expect(trend.label).toBeTruthy();
          expect(trend.body).toBeTruthy();
          expect(trend.marketsNote).toBeTruthy();
          expect(trend.opportunities.length).toBeGreaterThan(0);
          for (const source of trend.sources) {
            expect(source.title).toBeTruthy();
          }
        }
      }
    }
  });

  it('keeps USA selectable property content market-specific', () => {
    const scenario = getMegaScenario('US', 'en', 'us-dc-urban');
    expect(scenario).toBeTruthy();
    const text = JSON.stringify({
      options: scenario?.perMallOptions,
      perMall: scenario?.perMall,
      title: scenario?.title,
      intro: scenario?.intro,
    });
    expect(text).not.toMatch(/Sello|Tripla|Ideapark|Täby|Scandinavia|Finland|Sweden/i);
  });

  it('keeps English as the language of the selected local market, not as a USA fallback', () => {
    const finland = getMegaScenario('FI', 'en', 'realidea-tripla');
    const sweden = getMegaScenario('SE', 'en', 'westfield-mos');
    const usa = getMegaScenario('US', 'en', 'us-dc-urban');

    expect(finland?.country).toBe('FI');
    expect(finland?.title).toMatch(/Finland/i);
    expect(JSON.stringify(finland)).not.toMatch(/United States|Mall of America|Washington D\.C\.|NRF/i);

    expect(sweden?.country).toBe('SE');
    expect(sweden?.title).toMatch(/Sweden/i);
    expect(JSON.stringify(sweden)).not.toMatch(/United States|Mall of America|Washington D\.C\.|NRF/i);

    expect(usa?.country).toBe('US');
    expect(usa?.title).toMatch(/United States/i);
    expect(JSON.stringify(usa)).not.toMatch(/Tripla|Sello|Täby|Mall of Scandinavia/i);
  });

  it('uses local-market curated trend evidence when viewing FI or SE in English', () => {
    const localMarketText = JSON.stringify([
      ...getCuratedTrends('FI', 'en', 'realidea-tripla'),
      ...getCuratedTrends('SE', 'en', 'westfield-mos'),
    ]);
    const usaMarketText = JSON.stringify(getCuratedTrends('US', 'en', 'us-dc-urban'));

    expect(localMarketText).not.toMatch(/Mall of America|Washington D\.C\.|U\.S\. Census|NRF: US|US retail|USA/i);
    expect(usaMarketText).toMatch(/Mall of America|U\.S\. Census|NRF|US retail|USA/i);
  });

  it('provides USA curated trend content in every horizon', () => {
    expect(getCuratedTrendsByHorizon('US', 'en', 'short', 'us-dc-urban')).toHaveLength(3);
    expect(getCuratedTrendsByHorizon('US', 'en', 'medium', 'us-dc-urban')).toHaveLength(3);
    expect(getCuratedTrendsByHorizon('US', 'en', 'long', 'us-dc-urban')).toHaveLength(1);

    const usaText = JSON.stringify([
      ...getCuratedTrendsByHorizon('US', 'en', 'short', 'us-dc-urban'),
      ...getCuratedTrendsByHorizon('US', 'en', 'medium', 'us-dc-urban'),
      ...getCuratedTrendsByHorizon('US', 'en', 'long', 'us-dc-urban'),
    ]);
    expect(usaText).toMatch(/US|Mall of America|NRF|OECD|beauty|retail media/i);
  });

  it('provides a static USA monthly signal fallback', () => {
    const signal = getStaticSignalOfMonth('US');
    expect(signal?.country).toBe('US');
    expect(signal?.i18n?.en?.sections?.keyFindings?.length).toBeGreaterThanOrEqual(3);
  });
});
