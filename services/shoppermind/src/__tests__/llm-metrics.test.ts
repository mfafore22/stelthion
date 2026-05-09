import { describe, expect, it, beforeEach } from 'vitest';
import { setEmbeddingClient, setLLMClient } from '../engine/llm/client.js';
import {
  llmToolMetricsSnapshot,
  recordToolExecution,
  resetLlmToolMetricsForTests,
} from '../engine/observability/llm-metrics.js';

describe('llm and tool metrics', () => {
  beforeEach(() => resetLlmToolMetricsForTests());

  it('records LLM error chunks and latency', async () => {
    setLLMClient({
      async *chat() {
        yield { type: 'error', error: 'model unavailable' };
      },
    });

    for await (const _chunk of (await import('../engine/llm/client.js')).getLLMClient().chat([])) {
      // drain stream
    }

    const snapshot = llmToolMetricsSnapshot();
    expect(snapshot.llmErrorRate).toMatchObject({ numerator: 1, denominator: 1, ratio: 1 });
    expect(snapshot.metrics.some((metric) => metric.name === 'llm.latency_ms')).toBe(true);
  });

  it('records embedding failures and tool failures', async () => {
    setEmbeddingClient({
      async embed() {
        throw new Error('embedding down');
      },
    });

    await expect((await import('../engine/llm/client.js')).getEmbeddingClient().embed(['x']))
      .rejects.toThrow('embedding down');
    recordToolExecution({ toolId: 'shoppermind.retrieval.search', ok: false, durationMs: 12 });

    const snapshot = llmToolMetricsSnapshot();
    expect(snapshot.embeddingErrorRate.ratio).toBe(1);
    expect(snapshot.toolErrorRate.ratio).toBe(1);
  });
});
