import { describe, expect, it, vi, beforeEach } from 'vitest';

const rawSignalFindManyMock = vi.fn();
const signalSourceFindManyMock = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    rawSignal: { findMany: rawSignalFindManyMock },
    signalSource: { findMany: signalSourceFindManyMock },
  }),
}));

const { loadPhenomenonSourceEvidenceMap } = await import(
  '../engine/quality/source-evidence.js'
);

describe('loadPhenomenonSourceEvidenceMap', () => {
  beforeEach(() => {
    rawSignalFindManyMock.mockReset();
    signalSourceFindManyMock.mockReset();
  });

  it('loads distinct source evidence by phenomenon and market', async () => {
    rawSignalFindManyMock.mockResolvedValue([
      { phenomenonId: 'p1', sourceId: 's1' },
      { phenomenonId: 'p1', sourceId: 's2' },
      { phenomenonId: 'p2', sourceId: 's3' },
    ]);
    signalSourceFindManyMock.mockResolvedValue([
      { id: 's1', weight: 0.8 },
      { id: 's2', weight: 0.4 },
      { id: 's3', weight: 0.9 },
    ]);

    const evidence = await loadPhenomenonSourceEvidenceMap(['p1', 'p2'], 'helsinki-fi');

    expect(rawSignalFindManyMock.mock.calls[0]?.[0].distinct).toEqual([
      'phenomenonId',
      'sourceId',
    ]);
    expect(signalSourceFindManyMock.mock.calls[0]?.[0].where.OR).toEqual([
      { marketId: 'helsinki-fi' },
      { marketId: null },
    ]);
    expect(evidence.get('p1')).toMatchObject({
      sourceCount: 2,
      strongSourceCount: 1,
      sourceIds: ['s1', 's2'],
    });
    expect(evidence.get('p2')?.strongSourceCount).toBe(1);
  });
});
