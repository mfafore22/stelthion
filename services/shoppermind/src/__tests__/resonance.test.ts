import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({ phenomenonScore: { findMany } }),
}));

const { detectResonance } = await import('../engine/resonance/resonance-service.js');

function row(overrides: Partial<Record<string, unknown>>) {
  return {
    phenomenonId: 'p1',
    marketId: 'helsinki-fi',
    country: 'FI',
    compositeScore: 0.6,
    phenomenon: {
      id: 'p1',
      label: 'Passive house adoption',
      culturalScope: 'COUNTRY',
      culturalLocality: 'FI',
      phenomenonType: 'TREND',
    },
    ...overrides,
  };
}

describe('detectResonance', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('groups phenomena scored by ≥2 markets into a single resonant entry', async () => {
    findMany.mockResolvedValue([
      row({ marketId: 'helsinki-fi', compositeScore: 0.7 }),
      row({ marketId: 'tampere-fi', compositeScore: 0.55 }),
    ]);

    const result = await detectResonance({ date: new Date('2026-04-18T00:00:00Z') });

    expect(result).toHaveLength(1);
    expect(result[0]!.marketCount).toBe(2);
    expect(result[0]!.markets.map((m) => m.marketId)).toEqual(['helsinki-fi', 'tampere-fi']);
    expect(result[0]!.maxCompositeScore).toBeCloseTo(0.7);
    expect(result[0]!.avgCompositeScore).toBeCloseTo((0.7 + 0.55) / 2);
  });

  it('drops phenomena scored by a single market', async () => {
    findMany.mockResolvedValue([row({ phenomenonId: 'solo', marketId: 'helsinki-fi' })]);
    const result = await detectResonance({ date: new Date('2026-04-18T00:00:00Z') });
    expect(result).toEqual([]);
  });

  it('filters to resonances that include the requested marketId', async () => {
    findMany.mockResolvedValue([
      // p1 is resonant across berlin+tokyo but not helsinki — should be filtered out
      row({ phenomenonId: 'p1', marketId: 'berlin-de' }),
      row({ phenomenonId: 'p1', marketId: 'tokyo-jp' }),
      // p2 is resonant and includes helsinki — should be kept
      row({ phenomenonId: 'p2', marketId: 'helsinki-fi' }),
      row({ phenomenonId: 'p2', marketId: 'tampere-fi' }),
    ]);

    const result = await detectResonance({
      date: new Date('2026-04-18T00:00:00Z'),
      marketId: 'helsinki-fi',
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.phenomenonId).toBe('p2');
  });

  it('respects minMarkets > 2', async () => {
    findMany.mockResolvedValue([
      row({ marketId: 'a' }),
      row({ marketId: 'b' }),
      // only 2 markets — below minMarkets=3
    ]);
    const result = await detectResonance({
      date: new Date('2026-04-18T00:00:00Z'),
      minMarkets: 3,
    });
    expect(result).toEqual([]);
  });

  it('orders by marketCount desc then maxScore desc', async () => {
    findMany.mockResolvedValue([
      row({ phenomenonId: 'a', marketId: 'm1', compositeScore: 0.9 }),
      row({ phenomenonId: 'a', marketId: 'm2', compositeScore: 0.4 }),
      row({ phenomenonId: 'b', marketId: 'm1', compositeScore: 0.8 }),
      row({ phenomenonId: 'b', marketId: 'm2', compositeScore: 0.8 }),
      row({ phenomenonId: 'b', marketId: 'm3', compositeScore: 0.8 }),
    ]);
    const result = await detectResonance({ date: new Date('2026-04-18T00:00:00Z') });
    expect(result.map((r) => r.phenomenonId)).toEqual(['b', 'a']);
  });
});
