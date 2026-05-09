import {
  InMemoryMetricsPort,
  counter,
  metricRatio,
  timing,
} from '@stelthion/intelligence-runtime';
import type { EmbeddingClient, LLMClient, LLMStreamChunk } from '../llm/client.js';

const metrics = new InMemoryMetricsPort();

export function observeLLMClient(client: LLMClient): LLMClient {
  return {
    chat(messages, tools, options) {
      return observeChat(client, messages, tools, options);
    },
  };
}

export function observeEmbeddingClient(client: EmbeddingClient): EmbeddingClient {
  return {
    async embed(texts) {
      const started = Date.now();
      metrics.record(counter('embedding.calls'));
      try {
        const result = await client.embed(texts);
        metrics.record(timing('embedding.latency_ms', Date.now() - started));
        return result;
      } catch (err) {
        recordError('embedding.errors', err);
        metrics.record(timing('embedding.latency_ms', Date.now() - started));
        throw err;
      }
    },
  };
}

export function recordToolExecution(input: {
  toolId: string;
  ok: boolean;
  durationMs: number;
}): void {
  const tags = { toolId: input.toolId };
  metrics.record(counter('tool.calls', 1, tags));
  metrics.record(timing('tool.latency_ms', input.durationMs, tags));
  if (!input.ok) metrics.record(counter('tool.errors', 1, tags));
}

export function llmToolMetricsSnapshot() {
  const snapshot = metrics.snapshot();
  return {
    metrics: snapshot,
    llmErrorRate: metricRatio(snapshot, 'llm.errors', 'llm.calls'),
    embeddingErrorRate: metricRatio(snapshot, 'embedding.errors', 'embedding.calls'),
    toolErrorRate: metricRatio(snapshot, 'tool.errors', 'tool.calls'),
  };
}

export function resetLlmToolMetricsForTests(): void {
  metrics.clear();
}

async function* observeChat(
  client: LLMClient,
  messages: Parameters<LLMClient['chat']>[0],
  tools: Parameters<LLMClient['chat']>[1],
  options: Parameters<LLMClient['chat']>[2],
): AsyncIterable<LLMStreamChunk> {
  const started = Date.now();
  metrics.record(counter('llm.calls'));
  try {
    for await (const chunk of client.chat(messages, tools, options)) {
      if (chunk.type === 'error') metrics.record(counter('llm.errors'));
      yield chunk;
    }
    metrics.record(timing('llm.latency_ms', Date.now() - started));
  } catch (err) {
    recordError('llm.errors', err);
    metrics.record(timing('llm.latency_ms', Date.now() - started));
    throw err;
  }
}

function recordError(name: string, err: unknown): void {
  const errorType = err instanceof Error ? err.name : 'unknown';
  metrics.record(counter(name, 1, { errorType }));
}
