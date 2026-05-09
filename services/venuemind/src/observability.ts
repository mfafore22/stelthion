import {
  InMemoryMetricsPort,
  counter,
  timing,
  type MetricSummary,
} from '@stelthion/intelligence-runtime';

const metrics = new InMemoryMetricsPort();

export function recordRoute(
  path: string,
  status: number,
  durationMs: number,
): void {
  metrics.record(counter('venuemind.api.requests', 1, { path, status: String(status) }));
  metrics.record(timing('venuemind.api.latency_ms', durationMs, { path }));
  if (status >= 500) metrics.record(counter('venuemind.api.errors', 1, { path }));
}

export function venueMindMetricsSnapshot(): {
  summaries: MetricSummary[];
  service: Record<string, unknown>;
} {
  return {
    summaries: metrics.snapshot(),
    service: {
      queueDepth: 0,
      failedSourceFetches: 0,
      cacheHitRate: null,
      llmToolErrorRate: null,
      note: 'VenueMind pilot uses in-process metrics until durable jobs land.',
    },
  };
}

export function clearVenueMindMetrics(): void {
  metrics.clear();
}
