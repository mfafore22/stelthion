/**
 * Engine-local LLM client — chat + embedding interfaces plus deterministic
 * stub implementations. The service must not import the mall app's concierge
 * llm-client (service boundary); this module mirrors that interface so the
 * engine is self-contained. Phase 2+ will add a real provider adapter
 * selected via env (LOCAL_LLM_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY).
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMStreamChunk {
  type: 'text' | 'done' | 'error';
  text?: string;
  error?: string;
}

export interface LLMClient {
  chat(
    messages: LLMMessage[],
    tools?: unknown,
    options?: { temperature?: number; maxTokens?: number },
  ): AsyncIterable<LLMStreamChunk>;
}

class StubLLMClient implements LLMClient {
  async *chat(messages: LLMMessage[]): AsyncIterable<LLMStreamChunk> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUser?.content ?? '';
    const response = `Stub response for: ${query.slice(0, 80)}`;
    yield { type: 'text', text: response };
    yield { type: 'done' };
  }
}

let llmInstance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!llmInstance) llmInstance = new StubLLMClient();
  return llmInstance;
}

export function setLLMClient(client: LLMClient): void {
  llmInstance = client;
}

export interface EmbeddingClient {
  embed(texts: string[]): Promise<number[][]>;
}

class OllamaEmbeddingClient implements EmbeddingClient {
  constructor(private baseUrl: string, private model = 'nomic-embed-text') {}

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, input: text }),
      });
      if (!res.ok) throw new Error(`Embedding request failed: ${res.status}`);
      const data = (await res.json()) as { embeddings?: number[][]; embedding?: number[] };
      const vec = data.embeddings?.[0] ?? data.embedding;
      if (!vec) throw new Error('No embedding in response');
      results.push(vec);
    }
    return results;
  }
}

class StubEmbeddingClient implements EmbeddingClient {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => {
      const vec = new Array(384).fill(0).map(() => Math.random() - 0.5);
      const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
      return vec.map((v) => v / (mag || 1));
    });
  }
}

let embeddingInstance: EmbeddingClient | null = null;

export function getEmbeddingClient(): EmbeddingClient {
  if (!embeddingInstance) {
    const url = process.env.LOCAL_EMBEDDING_URL;
    embeddingInstance = url ? new OllamaEmbeddingClient(url) : new StubEmbeddingClient();
  }
  return embeddingInstance;
}

export function setEmbeddingClient(client: EmbeddingClient): void {
  embeddingInstance = client;
}
