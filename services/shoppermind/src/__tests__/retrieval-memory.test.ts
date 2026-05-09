import { describe, expect, it, vi, beforeEach } from 'vitest';

const buildCorpusForMarketMock = vi.fn();
const getMock = vi.fn();
const setMock = vi.fn();
const scanMock = vi.fn();
const delMock = vi.fn();
const materializeMarketOverviewMock = vi.fn();

vi.mock('../engine/insights/phenomenon-corpus.js', () => ({
  buildCorpusForMarket: buildCorpusForMarketMock,
}));

vi.mock('../db/redis.js', () => ({
  redis: () => ({
    get: getMock,
    set: setMock,
    scan: scanMock,
    del: delMock,
  }),
}));

vi.mock('../engine/memory/market-overview-memory.js', () => ({
  materializeMarketOverview: materializeMarketOverviewMock,
}));

const {
  materializeMarketRetrievalCorpus,
  readMarketRetrievalCorpus,
  refreshMarketMemoryCaches,
} = await import('../engine/memory/retrieval-memory.js');

describe('retrieval memory cache', () => {
  beforeEach(() => {
    buildCorpusForMarketMock.mockReset();
    getMock.mockReset();
    setMock.mockReset();
    scanMock.mockReset();
    delMock.mockReset();
    materializeMarketOverviewMock.mockReset();
  });

  it('materializes market retrieval documents into Redis', async () => {
    buildCorpusForMarketMock.mockResolvedValue([{ id: 'doc-1' }]);
    const snapshot = await materializeMarketRetrievalCorpus(
      'helsinki-fi',
      30,
      new Date('2026-05-07T12:00:00Z'),
    );

    expect(snapshot.documents).toEqual([{ id: 'doc-1' }]);
    expect(setMock.mock.calls[0]?.[0]).toBe('shoppermind:cache:helsinki-fi:retrieval:30');
    expect(setMock.mock.calls[0]?.[2]).toBe('EX');
  });

  it('reads freshness from cached retrieval snapshot', async () => {
    getMock.mockResolvedValue(JSON.stringify({
      domain: 'shoppermind',
      kind: 'retrieval',
      scope: { marketId: 'helsinki-fi' },
      materializedAt: '2026-05-07T10:00:00Z',
      expiresAt: '2026-05-07T16:00:00Z',
      freshness: 'fresh',
      value: {
        marketId: 'helsinki-fi',
        windowDays: 30,
        documents: [],
      },
    }));

    const snapshot = await readMarketRetrievalCorpus(
      'helsinki-fi',
      30,
      new Date('2026-05-07T12:00:00Z'),
    );
    expect(snapshot?.freshness).toBe('fresh');
  });

  it('invalidates market cache before rematerializing retrieval corpus', async () => {
    scanMock.mockResolvedValueOnce(['0', ['a', 'b']]);
    delMock.mockResolvedValue(2);
    buildCorpusForMarketMock.mockResolvedValue([]);
    materializeMarketOverviewMock.mockResolvedValue({});

    await refreshMarketMemoryCaches('helsinki-fi');

    expect(scanMock).toHaveBeenCalledWith(
      '0',
      'MATCH',
      'shoppermind:cache:helsinki-fi:*',
      'COUNT',
      100,
    );
    expect(delMock).toHaveBeenCalledWith('a', 'b');
    expect(setMock).toHaveBeenCalled();
    expect(materializeMarketOverviewMock).toHaveBeenCalledWith('helsinki-fi');
  });
});
