import { describe, expect, it, beforeEach } from 'vitest';
import {
  apiMetricsSnapshot,
  recordApiRequest,
  resetApiMetricsForTests,
} from '../engine/observability/api-metrics.js';

describe('api metrics', () => {
  beforeEach(() => resetApiMetricsForTests());

  it('records request count latency and errors by route class', () => {
    recordApiRequest({ routeClass: 'agent', statusCode: 200, durationMs: 25 });
    recordApiRequest({ routeClass: 'agent', statusCode: 502, durationMs: 75 });

    const snapshot = apiMetricsSnapshot();
    expect(snapshot.find((metric) => metric.name === 'api.requests')?.sum).toBe(2);
    expect(snapshot.find((metric) => metric.name === 'api.latency_ms')?.max).toBe(75);
    expect(snapshot.find((metric) => metric.name === 'api.errors')?.sum).toBe(1);
  });
});
