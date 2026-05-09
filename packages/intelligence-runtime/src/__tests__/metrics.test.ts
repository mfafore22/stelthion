import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryMetricsPort, counter, gauge, metricRatio, timing } from '../metrics.js';

test('InMemoryMetricsPort summarizes counters gauges and timings', () => {
  const port = new InMemoryMetricsPort();
  port.record(counter('api.requests'));
  port.record(counter('api.requests', 2));
  port.record(gauge('queue.depth', 4));
  port.record(timing('api.latency_ms', 25));
  port.record(timing('api.latency_ms', 75));

  const requests = port.snapshot('api.requests')[0]!;
  const latency = port.snapshot('api.latency_ms')[0]!;

  assert.equal(requests.sum, 3);
  assert.equal(requests.latest, 2);
  assert.equal(latency.min, 25);
  assert.equal(latency.max, 75);
});

test('metricRatio returns null until the denominator exists', () => {
  const port = new InMemoryMetricsPort();
  port.record(counter('llm.errors', 1));
  port.record(counter('llm.calls', 4));

  const ratio = metricRatio(port.snapshot(), 'llm.errors', 'llm.calls');
  const missing = metricRatio(port.snapshot(), 'llm.errors', 'missing.calls');

  assert.equal(ratio.ratio, 0.25);
  assert.equal(missing.ratio, null);
});
