/**
 * Embedding Client for ShopperMind clustering.
 *
 * Supports Ollama nomic-embed-text via LOCAL_EMBEDDING_URL,
 * falls back to random-vector stub for dev without a model.
 */

export interface EmbeddingClient {
  embed(texts: string[]): Promise<number[][]>;
}

class OllamaEmbeddingClient implements EmbeddingClient {
  constructor(
    private baseUrl: string,
    private model = 'nomic-embed-text',
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const res = await fetch(`${this.baseUrl}`, {
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
    if (url) {
      embeddingInstance = new OllamaEmbeddingClient(url);
    } else {
      embeddingInstance = new StubEmbeddingClient();
    }
  }
  return embeddingInstance;
}
