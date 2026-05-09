import { InMemoryMetricsPort, counter, timing } from '@stelthion/intelligence-runtime';

const metrics = new InMemoryMetricsPort();

export function recordApiRequest(input: {
  routeClass: string;
  statusCode: number;
  durationMs: number;
}): void {
  const tags = {
    routeClass: input.routeClass,
    status: String(input.statusCode),
  };
  metrics.record(counter('api.requests', 1, tags));
  metrics.record(timing('api.latency_ms', input.durationMs, tags));
  if (input.statusCode >= 500) {
    metrics.record(counter('api.errors', 1, tags));
  }
}

export function apiMetricsSnapshot() {
  return metrics.snapshot();
}

export function resetApiMetricsForTests(): void {
  metrics.clear();
}
