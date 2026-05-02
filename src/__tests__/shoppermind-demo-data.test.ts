import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function collectLocalizedStrings(
  value: unknown,
  language: string | null = null,
  pathParts: string[] = [],
): Array<{ path: string; language: string; value: string }> {
  if (typeof value === 'string') {
    return language ? [{ path: pathParts.join('.'), language, value }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectLocalizedStrings(item, language, [...pathParts, String(index)]));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectLocalizedStrings(child, ['en', 'fi', 'sv'].includes(key) ? key : language, [...pathParts, key]),
    );
  }

  return [];
}

describe('ShopperMind demo data verification', () => {
  const sourceCatalog = readJson<{
    sources: Array<{
      id: string;
      url: string;
      retrievedAt?: string;
      sourceType?: string;
      authorityTier?: string;
      verificationStatus?: string;
    }>;
  }>('data/shoppermind/report-sources.json');
  const curated = readJson<{
    trends: Array<{
      id: string;
      sourceIds: string[];
      countries?: string[];
      marketOverrides?: Record<
        string,
        {
          sourceIds?: string[];
          body?: Record<string, string>;
          marketsNote?: Record<string, string>;
          opportunities?: Record<string, string[]>;
        }
      >;
    }>;
  }>('data/shoppermind/curated-trends.json');
  const verifiedClaims = readJson<{
    claims: Array<{ id: string; trendId: string; sourceId: string; verificationStatus: string }>;
  }>('data/shoppermind/verified-claims.json');
  const usaMegaScenario = readJson<unknown>('data/shoppermind/mega-scenarios/usa.json');
  const stressScenarios = readJson<unknown>('data/shoppermind/scenario-stress.json');

  it('keeps the original trend IDs and adds exactly two MVP trends', () => {
    const ids = curated.trends.map((trend) => trend.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'smart-value-low-risk',
        'frictionless-omnichannel',
        'curated-discretionary',
        'circular-commerce',
        'service-led-ageing',
        'retail-media-and-mall-attention',
        'health-beauty-wellness-frequency',
      ]),
    );
    expect(ids).toHaveLength(7);
  });

  it('requires at least two verified sources for every curated trend', () => {
    const sourcesById = new Map(sourceCatalog.sources.map((source) => [source.id, source]));
    for (const trend of curated.trends) {
      const verifiedSources = trend.sourceIds
        .map((id) => sourcesById.get(id))
        .filter((source) => source?.verificationStatus === 'verified');

      expect(verifiedSources.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('requires verified source overrides for USA curated trends', () => {
    const sourcesById = new Map(sourceCatalog.sources.map((source) => [source.id, source]));
    for (const trend of curated.trends.filter((item) => item.countries?.includes('US'))) {
      const sourceIds = trend.marketOverrides?.US?.sourceIds ?? [];
      expect(sourceIds.length).toBeGreaterThanOrEqual(2);
      for (const sourceId of sourceIds) {
        expect(sourcesById.get(sourceId)?.verificationStatus).toBe('verified');
      }
    }
  });

  it('requires claim-level citations for every curated trend', () => {
    const sourcesById = new Map(sourceCatalog.sources.map((source) => [source.id, source]));
    for (const trend of curated.trends) {
      const trendClaims = verifiedClaims.claims.filter(
        (claim) => claim.trendId === trend.id && claim.verificationStatus === 'verified',
      );

      expect(trendClaims.length).toBeGreaterThanOrEqual(2);
      for (const claim of trendClaims) {
        expect(sourcesById.get(claim.sourceId)?.verificationStatus).toBe('verified');
      }
    }
  });

  it('does not allow generic homepage placeholders in verified sources', () => {
    const genericUrls = new Set(['https://nepa.com', 'https://www.mintel.com', 'https://ey.com', 'https://www.konj.se']);
    for (const source of sourceCatalog.sources) {
      expect(source.verificationStatus).toBe('verified');
      expect(source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.sourceType).toBeTruthy();
      expect(source.authorityTier).toBeTruthy();
      expect(genericUrls.has(source.url)).toBe(false);
    }
  });

  it('excludes Placer.ai from source catalog, claims and curated overrides', () => {
    expect(JSON.stringify(sourceCatalog)).not.toMatch(/placer\.ai|placer-malls/i);
    expect(JSON.stringify(verifiedClaims)).not.toMatch(/placer\.ai|placer-malls/i);
    expect(JSON.stringify(curated)).not.toMatch(/placer\.ai|placer-malls/i);
  });

  it('keeps English as the master copy for USA localized trend overrides', () => {
    for (const trend of curated.trends.filter((item) => item.countries?.includes('US'))) {
      const override = trend.marketOverrides?.US;
      expect(override?.body?.en).toBeTruthy();
      expect(override?.marketsNote?.en).toBeTruthy();
      expect(override?.opportunities?.en?.length).toBeGreaterThan(0);

      if (override?.body?.fi) expect(override.body.fi).not.toBe(override.body.en);
      if (override?.body?.sv) expect(override.body.sv).not.toBe(override.body.en);
    }
  });

  it('does not leak Finnish localized wording into English or Swedish branches', () => {
    const localizedStrings = [
      ...collectLocalizedStrings(sourceCatalog),
      ...collectLocalizedStrings(curated),
      ...collectLocalizedStrings(usaMegaScenario),
      ...collectLocalizedStrings(stressScenarios),
    ];
    const finnishOnlyTerms =
      /\b(kaupan media|harkinnanvar|kohdekeskus|korkeampi|kauneus|hyvinvointi|edulliset merkkituotteet|nouto- ja toimituspalvelu|kokeilumyymälä|arvo)\b/i;

    for (const item of localizedStrings.filter((entry) => entry.language !== 'fi')) {
      const match = item.value.match(finnishOnlyTerms);
      if (match) {
        throw new Error(`Finnish-only term "${match[0]}" leaked into ${item.path}`);
      }
    }
  });
});
