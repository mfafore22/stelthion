import { describe, it, expect, vi, beforeEach } from 'vitest';

const phenomenonFindUnique = vi.fn();
const scoreFindMany = vi.fn();
const linkFindMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenon: { findUnique: phenomenonFindUnique },
    phenomenonScore: { findMany: scoreFindMany },
    phenomenonLink: { findMany: linkFindMany },
  }),
}));

const { buildCorpusDocument } = await import('../engine/insights/phenomenon-corpus.js');

function phen(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'p1',
    label: 'Passive house adoption',
    description: 'Discourse about low-energy housing.',
    phenomenonType: 'TREND',
    lifecycleState: null,
    state: 'EMERGING',
    culturalScope: 'COUNTRY',
    culturalLocality: 'FI',
    footTrafficScope: 'COUNTRY',
    footTrafficLocality: 'FI',
    firstSeenAt: new Date('2026-03-01T00:00:00Z'),
    lastSignalAt: new Date('2026-04-18T00:00:00Z'),
    eventStart: null,
    eventEnd: null,
    keywords: ['passive house', 'energy certificate'],
    ...overrides,
  };
}

function score(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    date: new Date('2026-04-18T00:00:00Z'),
    compositeScore: 0.62,
    volume: 12,
    velocity: 0.4,
    acceleration: 0.05,
    footTrafficScore: 0.3,
    culturalScore: 0.9,
    footTrafficProximity: 0.4,
    culturalProximity: 1,
    linkBoost: 0,
    ...overrides,
  };
}

describe('buildCorpusDocument', () => {
  beforeEach(() => {
    phenomenonFindUnique.mockReset();
    scoreFindMany.mockReset();
    linkFindMany.mockReset();
  });

  it('returns null when the phenomenon is missing', async () => {
    phenomenonFindUnique.mockResolvedValue(null);
    scoreFindMany.mockResolvedValue([]);
    linkFindMany.mockResolvedValue([]);
    const doc = await buildCorpusDocument('missing', 'helsinki-fi');
    expect(doc).toBeNull();
  });

  it('composes labeled sections and populates metadata', async () => {
    phenomenonFindUnique.mockResolvedValue(phen());
    scoreFindMany.mockResolvedValue([score(), score({ date: new Date('2026-04-17T00:00:00Z'), compositeScore: 0.55 })]);
    linkFindMany.mockResolvedValue([]);

    const doc = await buildCorpusDocument('p1', 'helsinki-fi');
    expect(doc).not.toBeNull();
    expect(doc!.id).toBe('helsinki-fi:p1');
    expect(doc!.title).toBe('Passive house adoption');
    expect(doc!.body).toContain('# Passive house adoption');
    expect(doc!.body).toContain('## Classification');
    expect(doc!.body).toContain('## Locality');
    expect(doc!.body).toContain('## Latest signals');
    expect(doc!.body).toContain('## Trend over last 7 scored days');
    expect(doc!.body).toContain('## Keywords');
    expect(doc!.metadata.latestCompositeScore).toBeCloseTo(0.62);
    expect(doc!.metadata.culturalScope).toBe('COUNTRY');
  });

  it('includes inbound and outbound link rows in the link graph section', async () => {
    phenomenonFindUnique.mockResolvedValue(phen());
    scoreFindMany.mockResolvedValue([score()]);
    linkFindMany
      .mockResolvedValueOnce([
        {
          toPhenomenonId: 'p2',
          fromPhenomenonId: 'p1',
          linkType: 'MANIFESTATION_OF',
          weight: 0.8,
          inferredBy: 'llm',
        },
      ])
      .mockResolvedValueOnce([
        {
          toPhenomenonId: 'p1',
          fromPhenomenonId: 'p3',
          linkType: 'ACCELERATES',
          weight: 0.6,
          inferredBy: 'human',
        },
      ]);

    const doc = await buildCorpusDocument('p1', 'helsinki-fi');
    expect(doc!.body).toContain('MANIFESTATION_OF → p2');
    expect(doc!.body).toContain('p3 → ACCELERATES');
    expect(doc!.metadata.linkedPhenomenonIds).toEqual(['p2', 'p3']);
  });
});
