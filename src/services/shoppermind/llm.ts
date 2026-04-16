/**
 * Minimal LLM client for ShopperMind prompts.
 *
 * Self-contained — no dependency on concierge services.
 * Stub returns placeholder text until a local LLM is configured.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface LLMStreamChunk {
  type: 'text' | 'tool_calls' | 'done' | 'error';
  text?: string;
  error?: string;
}

export interface LLMClient {
  chat(
    messages: LLMMessage[],
    tools?: unknown[],
    options?: { temperature?: number; maxTokens?: number },
  ): AsyncIterable<LLMStreamChunk>;
}

class StubLLMClient implements LLMClient {
  async *chat(messages: LLMMessage[]): AsyncIterable<LLMStreamChunk> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const fallback = `No local LLM connected. Input: "${(lastUser?.content ?? '').slice(0, 80)}"`;
    yield { type: 'text', text: fallback };
    yield { type: 'done' };
  }
}

let instance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!instance) {
    instance = new StubLLMClient();
  }
  return instance;
}
