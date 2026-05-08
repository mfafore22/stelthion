import { buildCorpusForMarket, type CorpusDocument } from './phenomenon-corpus.js';
import { getLLMClient, type LLMMessage } from '../llm/client.js';
import { loadMarket } from '../registry/market-registry.js';

export interface ChatRequest {
  marketId: string;
  question: string;
  topK?: number;
  windowDays?: number;
}

export interface ChatCitation {
  phenomenonId: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface ChatResponse {
  marketId: string;
  question: string;
  answer: string;
  citations: ChatCitation[];
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for',
  'by', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this',
  'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'it', 'its',
  'about', 'my', 'your', 'our', 'their', 'will', 'would', 'should', 'can',
  'could', 'do', 'does', 'did', 'have', 'has', 'had', 'me', 'you', 'we',
  'they', 'them', 'i',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöåáéíóú\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreDocument(docTokens: Set<string>, queryTokens: string[]): number {
  let overlap = 0;
  for (const t of queryTokens) if (docTokens.has(t)) overlap++;
  return overlap / Math.max(queryTokens.length, 1);
}

function excerpt(body: string, queryTokens: string[], maxLen = 280): string {
  const lines = body.split('\n');
  // Prefer the first line containing any query token; fall back to the body head.
  const needle = lines.find((l) =>
    queryTokens.some((t) => l.toLowerCase().includes(t)),
  );
  const text = (needle ?? lines.slice(0, 4).join(' ')).trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

/**
 * RAG-style answer over the market's phenomenon corpus. First cut: lexical
 * retrieval (token overlap) over freshly-built documents; Phase 4 follow-up
 * swaps in the embedding store. The chat client sees only citations for
 * phenomena this market is subscribed to, so a Helsinki user cannot pull
 * context from a Dubai-only trend.
 */
export async function answerInsightsQuestion(req: ChatRequest): Promise<ChatResponse> {
  const topK = req.topK ?? 4;
  const windowDays = req.windowDays ?? 30;

  const market = await loadMarket(req.marketId);
  if (!market) {
    return {
      marketId: req.marketId,
      question: req.question,
      answer: "I don't have data for that market.",
      citations: [],
    };
  }

  const corpus = await buildCorpusForMarket(req.marketId, windowDays);
  const queryTokens = tokenize(req.question);
  const ranked = rank(corpus, queryTokens, topK);

  if (ranked.length === 0) {
    return {
      marketId: req.marketId,
      question: req.question,
      answer:
        'No phenomena currently tracked in this market match that question. Try broadening the window or rephrasing.',
      citations: [],
    };
  }

  const contextBlocks = ranked.map(
    ({ doc }, i) => `[${i + 1}] ${doc.title} (id=${doc.phenomenonId})\n${doc.body}`,
  );

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: [
        `You are ShopperMind, a trend analyst for the ${market.profile.displayName} market.`,
        `Answer the user's question using only the provided phenomenon context.`,
        `Cite sources by bracket number in the form [1], [2]. If the context is insufficient, say so.`,
        `Keep answers grounded, specific, and under 250 words.`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: `${req.question}\n\n---\nContext:\n${contextBlocks.join('\n\n')}`,
    },
  ];

  const client = getLLMClient();
  let answer = '';
  for await (const chunk of client.chat(messages, undefined, { temperature: 0.2, maxTokens: 512 })) {
    if (chunk.type === 'text' && chunk.text) answer += chunk.text;
    if (chunk.type === 'error') {
      answer = `Insights model error: ${chunk.error ?? 'unknown'}`;
      break;
    }
  }

  const citations: ChatCitation[] = ranked.map(({ doc, score }) => ({
    phenomenonId: doc.phenomenonId,
    title: doc.title,
    excerpt: excerpt(doc.body, queryTokens),
    score,
  }));

  return {
    marketId: req.marketId,
    question: req.question,
    answer: answer.trim(),
    citations,
  };
}

function rank(
  corpus: CorpusDocument[],
  queryTokens: string[],
  topK: number,
): Array<{ doc: CorpusDocument; score: number }> {
  const ranked = corpus
    .map((doc) => ({
      doc,
      score: scoreDocument(new Set(tokenize(doc.title + ' ' + doc.body)), queryTokens),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return ranked;
}
