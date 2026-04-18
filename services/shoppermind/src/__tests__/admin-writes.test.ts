import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SHOPPERMIND_SERVICE_TOKEN = 'service-token-1234567890';
process.env.SHOPPERMIND_INTERNAL_TOKEN = 'internal-token-1234567890';
process.env.REVIEW_TTL_ENABLED = 'false';
process.env.RETENTION_ENABLED = 'false';

const marketUpsert = vi.fn();
const phenomenonFindUnique = vi.fn();
const phenomenonLinkUpsert = vi.fn();
const loadMarket = vi.fn();
const invalidateMarketCache = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    market: { upsert: marketUpsert },
    phenomenon: { findUnique: phenomenonFindUnique },
    phenomenonLink: { upsert: phenomenonLinkUpsert },
  }),
  disconnectPrisma: async () => {},
}));

vi.mock('../db/redis.js', () => ({
  redis: () => ({}),
  disconnectRedis: async () => {},
}));

vi.mock('../engine/registry/market-registry.js', () => ({
  loadMarket,
  listMarkets: async () => [],
  invalidateMarketCache,
}));

const { buildServer } = await import('../http/server.js');

const INTERNAL = 'Bearer internal-token-1234567890';
const SERVICE = 'Bearer service-token-1234567890';

function sampleMarket() {
  return {
    id: 'helsinki-fi',
    country: 'FI',
    region: 'uusimaa-fi',
    displayName: 'Helsinki',
    industryFocus: 'retail',
    geoAnchorLat: 60.17,
    geoAnchorLon: 24.94,
    footTrafficSubs: ['CITY:helsinki-fi', 'COUNTRY:FI'],
    culturalSubs: ['COUNTRY:FI'],
    footTrafficAxisWeight: 0.5,
    culturalAxisWeight: 0.5,
    profile: {
      displayName: 'Helsinki',
      industryFocus: 'retail',
      language: 'fi',
      persona: 'pragmatic',
      categoryKeywords: {},
      relevanceKeywords: [],
      weightPriors: {},
      seedSources: [],
    },
    policy: { version: 1 as const, thresholds: {}, lifecycleModifiers: { UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 } },
    active: true,
  };
}

describe('PUT /v1/markets/:id/config', () => {
  beforeEach(() => {
    marketUpsert.mockReset();
    loadMarket.mockReset();
    invalidateMarketCache.mockReset();
  });

  it('rejects service-token callers with 401', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/markets/helsinki-fi/config',
      headers: { authorization: SERVICE, 'content-type': 'application/json' },
      payload: { displayName: 'Helsinki Keskusta' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('404s when the market does not exist', async () => {
    loadMarket.mockResolvedValue(null);
    const app = await buildServer();
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/markets/nonexistent/config',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { displayName: 'X' },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('upserts with a partial body and invalidates cache', async () => {
    const original = sampleMarket();
    const updated = { ...original, displayName: 'Helsinki Keskusta' };
    loadMarket.mockResolvedValueOnce(original).mockResolvedValueOnce(updated);
    marketUpsert.mockResolvedValue(updated);

    const app = await buildServer();
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/markets/helsinki-fi/config',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { displayName: 'Helsinki Keskusta' },
    });
    expect(res.statusCode).toBe(200);
    expect(marketUpsert).toHaveBeenCalledTimes(1);
    const call = marketUpsert.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'helsinki-fi' });
    expect(call.update).toEqual({ displayName: 'Helsinki Keskusta' });
    expect(invalidateMarketCache).toHaveBeenCalledWith('helsinki-fi');
    await app.close();
  });

  it('rejects invalid policy shape with 400', async () => {
    loadMarket.mockResolvedValue(sampleMarket());
    const app = await buildServer();
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/markets/helsinki-fi/config',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { policy: { version: 999, thresholds: {} } },
    });
    expect(res.statusCode).toBe(400);
    expect(marketUpsert).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /v1/phenomena/:id/links', () => {
  beforeEach(() => {
    phenomenonFindUnique.mockReset();
    phenomenonLinkUpsert.mockReset();
  });

  it('rejects service-token callers with 401', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/phenomena/p1/links',
      headers: { authorization: SERVICE, 'content-type': 'application/json' },
      payload: { toPhenomenonId: 'p2', linkType: 'CONTRIBUTES_TO' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('rejects self-link with 400', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/phenomena/p1/links',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { toPhenomenonId: 'p1', linkType: 'CONTRIBUTES_TO' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('self_link');
    await app.close();
  });

  it('404s when either phenomenon does not exist', async () => {
    phenomenonFindUnique.mockResolvedValueOnce({ id: 'p1' }).mockResolvedValueOnce(null);
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/phenomena/p1/links',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { toPhenomenonId: 'missing', linkType: 'CONTRIBUTES_TO' },
    });
    expect(res.statusCode).toBe(404);
    expect(phenomenonLinkUpsert).not.toHaveBeenCalled();
    await app.close();
  });

  it('upserts on the unique (from, to, type) key and clears supersededAt', async () => {
    phenomenonFindUnique.mockResolvedValueOnce({ id: 'p1' }).mockResolvedValueOnce({ id: 'p2' });
    const now = new Date();
    phenomenonLinkUpsert.mockResolvedValue({
      id: 'link1',
      fromPhenomenonId: 'p1',
      toPhenomenonId: 'p2',
      linkType: 'CONTRIBUTES_TO',
      weight: 0.8,
      inferredBy: 'human',
      rationale: 'manual override',
      createdAt: now,
      supersededAt: null,
    });

    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/phenomena/p1/links',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: {
        toPhenomenonId: 'p2',
        linkType: 'CONTRIBUTES_TO',
        weight: 0.8,
        rationale: 'manual override',
      },
    });
    expect(res.statusCode).toBe(201);
    const call = phenomenonLinkUpsert.mock.calls[0][0];
    expect(call.where).toEqual({
      fromPhenomenonId_toPhenomenonId_linkType: {
        fromPhenomenonId: 'p1',
        toPhenomenonId: 'p2',
        linkType: 'CONTRIBUTES_TO',
      },
    });
    expect(call.update.supersededAt).toBeNull();
    expect(call.update.inferredBy).toBe('human');
    await app.close();
  });

  it('rejects unknown link types with 400', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/phenomena/p1/links',
      headers: { authorization: INTERNAL, 'content-type': 'application/json' },
      payload: { toPhenomenonId: 'p2', linkType: 'NONSENSE' },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
