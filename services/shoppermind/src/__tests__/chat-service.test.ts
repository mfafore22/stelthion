import { describe, it, expect, vi, beforeEach } from 'vitest';

const phenomenonFindUnique = vi.fn();
const scoreFindMany = vi.fn();
const linkFindMany = vi.fn();
const loadMarketMock = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenon: { findUnique: phenomenonFindUnique },
    phenomenonScore: { findMany: scoreFindMany },
    phenomenonLink: { findMany: linkFindMany },
  }),
}));

vi.mock('../engine/registry/market-registry.js', () => ({
  loadMarket: loadMarketMock,
}));

const { answerInsightsQuestion } = await import('../engine/insights/chat-service.js');
const { setLLMClient } = await import('../engine/llm/client.js');

function phen(id: string, label: string, description: string) {
  return {
    id,
    label,
    description,
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
    keywords: [],
  };
}

describe('answerInsightsQuestion', () => {
  beforeEach(() => {
    phenomenonFindUnique.mockReset();
    scoreFindMany.mockReset();
    linkFindMany.mockReset();
    loadMarketMock.mockReset();
    loadMarketMock.mockResolvedValue({
      id: 'helsinki-fi',
      profile: { displayName: 'Helsinki', language: 'en' },
      policy: {},
    });
    // Default empty links
    linkFindMany.mockResolvedValue([]);
  });

  it('returns empty-citation response when market is unknown', async () => {
    loadMarketMock.mockResolvedValue(null);
    const res = await answerInsightsQuestion({ marketId: 'bogus', question: 'hi' });
    expect(res.citations).toEqual([]);
    expect(res.answer).toContain("don't have data");
  });

  it('returns no-match response when no phenomena in the corpus overlap the question', async () => {
    // buildCorpusForMarket uses a distinct findMany first
    scoreFindMany.mockResolvedValueOnce([{ phenomenonId: 'p1' }]); // distinct call
    phenomenonFindUnique.mockResolvedValue(phen('p1', 'Dubai luxury retail', 'about dubai'));
    scoreFindMany.mockResolvedValueOnce([]); // score fetch inside buildCorpusDocument

    const res = await answerInsightsQuestion({
      marketId: 'helsinki-fi',
      question: 'passive house adoption Finland',
    });
    expect(res.citations).toEqual([]);
    expect(res.answer.toLowerCase()).toContain('no phenomena');
  });

  it('ranks corpus documents by token overlap and calls the LLM with cited context', async () => {
    scoreFindMany.mockResolvedValueOnce([{ phenomenonId: 'p1' }, { phenomenonId: 'p2' }]);
    phenomenonFindUnique
      .mockResolvedValueOnce(phen('p1', 'Passive house adoption', 'Low-energy housing discourse'))
      .mockResolvedValueOnce(phen('p2', 'Luxury retail openings', 'High-end flagships'));
    scoreFindMany
      .mockResolvedValueOnce([]) // p1 scores
      .mockResolvedValueOnce([]); // p2 scores

    let chatInput: unknown[] = [];
    setLLMClient({
      async *chat(messages: unknown[]) {
        chatInput = messages;
        yield { type: 'text', text: 'Passive house uptake is rising in Finland [1].' };
        yield { type: 'done' };
      },
    } as never);

    const res = await answerInsightsQuestion({
      marketId: 'helsinki-fi',
      question: 'What passive housing trends matter?',
    });

    expect(res.citations).toHaveLength(1);
    expect(res.citations[0]!.phenomenonId).toBe('p1');
    expect(res.answer).toContain('Passive house uptake');
    expect(chatInput.length).toBe(2);
  });
});
