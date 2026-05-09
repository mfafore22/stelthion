import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirst = vi.fn();
const upsert = vi.fn();
const listMarkets = vi.fn();
const loadMarket = vi.fn();
const refreshMarketMemoryCaches = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenonScore: { findFirst },
    signalOfTheDay: { upsert },
  }),
}));

vi.mock('../engine/registry/market-registry.js', () => ({
  listMarkets,
  loadMarket,
}));

vi.mock('../engine/memory/retrieval-memory.js', () => ({
  refreshMarketMemoryCaches,
}));

const { materializeSignalOfTheDay } =
  await import('../engine/signals/signal-of-the-day-materializer.js');

describe('signal of the day materializer', () => {
  beforeEach(() => {
    findFirst.mockReset();
    upsert.mockReset();
    listMarkets.mockReset();
    loadMarket.mockReset();
    refreshMarketMemoryCaches.mockReset();
  });

  it('materializes todays signal from the top scored phenomenon', async () => {
    loadMarket.mockResolvedValue({ id: 'helsinki-fi', country: 'FI', displayName: 'Helsinki', active: true });
    findFirst.mockResolvedValue(score());
    upsert.mockResolvedValue({ id: 'sot-1' });

    const summary = await materializeSignalOfTheDay({
      date: '2026-05-08',
      marketIds: ['helsinki-fi'],
    });

    expect(summary).toMatchObject({ date: '2026-05-08', materialized: 1, skipped: 0 });
    expect(findFirst).toHaveBeenCalledWith({
      where: { marketId: 'helsinki-fi', date: { lte: new Date('2026-05-08T00:00:00.000Z') } },
      orderBy: [{ date: 'desc' }, { compositeScore: 'desc' }],
      include: { phenomenon: true },
    });
    expect(upsert.mock.calls[0]?.[0].create).toMatchObject({
      marketId: 'helsinki-fi',
      country: 'FI',
      phenomenonIds: ['phenomenon-1'],
    });
    expect(upsert.mock.calls[0]?.[0].create.narrative).toContain('2026-05-08');
    expect(upsert.mock.calls[0]?.[0].create.i18n.fi.narrative).toContain('Vähittäiskauppa');
    expect(refreshMarketMemoryCaches).toHaveBeenCalledWith('helsinki-fi');
  });

  it('skips markets without scored phenomena', async () => {
    listMarkets.mockResolvedValue([
      { id: 'helsinki-fi', country: 'FI', displayName: 'Helsinki', active: true },
    ]);
    findFirst.mockResolvedValue(null);

    const summary = await materializeSignalOfTheDay({ date: '2026-05-08' });

    expect(summary).toMatchObject({ processed: 1, materialized: 0, skipped: 1 });
    expect(summary.results[0]).toMatchObject({ marketId: 'helsinki-fi', reason: 'no_scores' });
    expect(upsert).not.toHaveBeenCalled();
    expect(refreshMarketMemoryCaches).not.toHaveBeenCalled();
  });
});

function score() {
  return {
    phenomenonId: 'phenomenon-1',
    country: 'FI',
    date: new Date('2026-05-08T00:00:00.000Z'),
    compositeScore: 0.87,
    phenomenon: {
      id: 'phenomenon-1',
      label: 'Retail concentration tightening',
      description: 'Large retail anchors are gaining share.',
      i18n: {
        fi: { label: 'Vähittäiskauppa tiivistyy', summary: 'Ankkuriliikkeet vahvistuvat.' },
        sv: { label: 'Detaljhandeln koncentreras', summary: 'Ankarbutiker stärks.' },
      },
    },
  };
}
