import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CorpusDocument } from '../engine/insights/phenomenon-corpus.js';

const loadMarketMock = vi.fn();
const readMarketRetrievalCorpusMock = vi.fn();

vi.mock('../engine/registry/market-registry.js', () => ({
  loadMarket: loadMarketMock,
}));

vi.mock('../engine/memory/retrieval-memory.js', () => ({
  readMarketRetrievalCorpus: readMarketRetrievalCorpusMock,
}));

const { answerInsightsQuestion } = await import('../engine/insights/chat-service.js');
const { setLLMClient } = await import('../engine/llm/client.js');

function doc(id: string, title: string, body: string): CorpusDocument {
  return {
    id,
    phenomenonId: id,
    marketId: 'helsinki-fi',
    title,
    body,
    metadata: {
      latestCompositeScore: 0.82,
      lastSignalAt: '2026-05-07T12:00:00Z',
      sourceCount: 3,
      strongSourceCount: 2,
      sourceIds: ['source-a', 'source-b', 'source-c'],
    } as CorpusDocument['metadata'],
  };
}

describe('answerInsightsQuestion', () => {
  beforeEach(() => {
    loadMarketMock.mockReset();
    readMarketRetrievalCorpusMock.mockReset();
    loadMarketMock.mockResolvedValue({
      id: 'helsinki-fi',
      profile: { displayName: 'Helsinki', language: 'en' },
      policy: {},
    });
  });

  it('returns empty-citation response when market is unknown', async () => {
    loadMarketMock.mockResolvedValue(null);
    const res = await answerInsightsQuestion({ marketId: 'bogus', question: 'hi' });
    expect(res.citations).toEqual([]);
    expect(res.answer).toContain("don't have data");
  });

  it('returns no-match response when no phenomena in the corpus overlap the question', async () => {
    readMarketRetrievalCorpusMock.mockResolvedValue({
      documents: [doc('p1', 'Dubai luxury retail', 'about dubai')],
    });

    const res = await answerInsightsQuestion({
      marketId: 'helsinki-fi',
      question: 'passive house adoption Finland',
    });
    expect(res.citations).toEqual([]);
    expect(res.answer.toLowerCase()).toContain('no materialized phenomena');
  });

  it('does not build retrieval corpus on chat requests', async () => {
    readMarketRetrievalCorpusMock.mockResolvedValue(null);
    const res = await answerInsightsQuestion({
      marketId: 'helsinki-fi',
      question: 'What passive housing trends matter?',
    });
    expect(res.citations).toEqual([]);
    expect(res.answer.toLowerCase()).toContain('not materialized');
  });

  it('ranks corpus documents by token overlap and calls the LLM with cited context', async () => {
    readMarketRetrievalCorpusMock.mockResolvedValue({
      documents: [
        doc('p1', 'Passive house adoption', 'Low-energy housing discourse'),
        doc('p2', 'Luxury retail openings', 'High-end flagships'),
      ],
    });

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
    expect(res.citations[0]!.qualityView?.evidence.sourceIds).toContain('source-a');
    expect(res.citations[0]!.qualityView?.handlingMode).toBeTruthy();
    expect(res.qualityView?.quality.chatCaution).toBeTruthy();
    expect(res.answer).toContain('Passive house uptake');
    expect(chatInput.length).toBe(2);
  });
});
