/**
 * LLM Client — Interface + Stub
 *
 * Designed for a locally installed open-source LLM (Ollama, llama.cpp, vLLM).
 * The stub returns placeholder responses until the local LLM is set up.
 *
 * When ready, implement the `LocalLLMClient` class to connect to LOCAL_LLM_URL.
 */

// ── Interface ─────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMStreamChunk {
  type: 'text' | 'tool_calls' | 'done' | 'error';
  text?: string;
  toolCalls?: LLMToolCall[];
  error?: string;
}

export interface LLMToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface LLMClient {
  /**
   * Send a chat completion request with optional tool definitions.
   * Returns an async iterable of stream chunks.
   */
  chat(
    messages: LLMMessage[],
    tools?: LLMToolSchema[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncIterable<LLMStreamChunk>;
}

// ── Stub Implementation ───────────────────────────────────

/**
 * Stub client that returns a placeholder response.
 * Replace with LocalLLMClient when the OS LLM is installed.
 */
export class StubLLMClient implements LLMClient {
  async *chat(
    messages: LLMMessage[],
    tools?: LLMToolSchema[],
  ): AsyncIterable<LLMStreamChunk> {
    // Extract the last user message for context
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const query = lastUser?.content || '';

    // If tools are available, simulate tool calling based on keywords
    if (tools?.length) {
      const toolCalls = this.detectToolCalls(query, tools);
      if (toolCalls.length > 0) {
        yield { type: 'tool_calls', toolCalls };
        return;
      }
    }

    // Default stub response
    const response = `I understood your question: "${query.substring(0, 100)}". The local LLM is not yet connected — once it's running, I'll be able to answer using real property data. For now, the concierge UI and all data tools are wired and ready.`;

    // Simulate streaming by yielding word by word
    const words = response.split(' ');
    for (const word of words) {
      yield { type: 'text', text: word + ' ' };
      await new Promise(r => setTimeout(r, 30));
    }

    yield { type: 'done' };
  }

  /** Simple keyword-based tool detection for the stub */
  private detectToolCalls(query: string, tools: LLMToolSchema[]): LLMToolCall[] {
    const lower = query.toLowerCase();
    const calls: LLMToolCall[] = [];

    const keywords: Record<string, string[]> = {
      get_current_weather: ['weather', 'sää', 'säätila', 'temperature', 'lämpötila', 'rain', 'sade'],
      get_weather_forecast: ['forecast', 'ennuste', 'tomorrow', 'huomenna', 'next week'],
      get_current_visitors: ['current visitors', 'how many visitors', 'visitors now', 'nyt kävijä', 'kävijämäärä nyt', 'montako kävijää', 'live visitors', 'right now', 'besökare nu'],
      get_footfall_profile: ['footfall', 'visitors', 'kävijä', 'traffic', 'liikenne', 'profile', 'profiili'],
      get_footfall_for_date: ['footfall on', 'visitors on', 'how many people'],
      get_events: ['event', 'tapahtuma', 'concert', 'konsertti', 'match', 'ottelu'],
      get_parking_status: ['parking', 'pysäköinti', 'car', 'auto'],
      get_transport: ['bus', 'train', 'juna', 'bussi', 'departure', 'lähtö', 'transport', 'liikenne', 'kollektivtrafik'],
      get_mall_stats: ['stats', 'kpi', 'sales', 'myynti', 'visitors annual', 'tunnusluku', 'tunnusluvut', 'nyckeltal', 'key metrics'],
      get_zone_info: ['zone', 'alue', 'vyöhyke', 'floor'],
      get_store_info: ['store', 'shop', 'kauppa', 'myymälä', 'where is'],
      get_zone_flow: ['flow', 'movement', 'passage', 'corridor', 'käytävä', 'kävijävirr', 'besöksflöde', 'visitor flow'],
      get_demographics: ['demographic', 'population', 'väestö', 'income', 'tulo', 'catchment'],
      get_shoppermind_trends: ['trend', 'trendi', 'emerging', 'nouseva', 'phenomenon', 'ilmiö', 'signal', 'signaali', 'shoppermind', 'market trend', 'industry', 'fading', 'accelerating', 'what is rising', 'what is hot', 'property trend', 'retail trend'],
    };

    for (const [toolName, kws] of Object.entries(keywords)) {
      if (kws.some(kw => lower.includes(kw)) && tools.some(t => t.name === toolName)) {
        calls.push({
          id: `stub_${toolName}_${Date.now()}`,
          name: toolName,
          arguments: {},
        });
      }
    }

    return calls;
  }
}

// ── Future: Local LLM Client ──────────────────────────────

/**
 * TODO: Implement when local OS LLM is ready.
 *
 * Example for Ollama:
 *
 * export class OllamaClient implements LLMClient {
 *   private baseUrl: string;
 *   private model: string;
 *
 *   constructor(baseUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434', model = 'llama3.1') {
 *     this.baseUrl = baseUrl;
 *     this.model = model;
 *   }
 *
 *   async *chat(messages, tools, options) {
 *     const response = await fetch(`${this.baseUrl}/api/chat`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         model: this.model,
 *         messages,
 *         tools: tools?.map(t => ({ type: 'function', function: t })),
 *         stream: true,
 *         options: { temperature: options?.temperature ?? 0.7 },
 *       }),
 *     });
 *     // Parse NDJSON stream and yield LLMStreamChunks...
 *   }
 * }
 */

// ── Embedding Client ─────────────────────────────────────

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

// ── Factory ───────────────────────────────────────────────

let clientInstance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!clientInstance) {
    // TODO: When LOCAL_LLM_URL is configured, use OllamaClient or similar
    // if (process.env.LOCAL_LLM_URL) {
    //   clientInstance = new OllamaClient(process.env.LOCAL_LLM_URL);
    // } else {
    clientInstance = new StubLLMClient();
    // }
  }
  return clientInstance;
}
