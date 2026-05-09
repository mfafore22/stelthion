import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { handleVenueMindRoute } from '../http/handler.js';
import { clearVenueMindMetrics } from '../observability.js';

const config = {
  port: 0,
  internalToken: 'test-token',
  nodeEnv: 'test',
};

test('VenueMind HTTP routes expose overview, governance, and metrics', async () => {
  clearVenueMindMetrics();
  const overview = await route('GET', '/v1/overview?venueId=venue-fi-nokia-arena');
  assert.equal(overview.status, 200);
  assert.equal((overview.body as Record<string, unknown>).venueId, 'venue-fi-nokia-arena');

  const governance = await route('GET', '/internal/governance');
  assert.equal(governance.status, 200);
  assert.equal((governance.body as Record<string, unknown>).status, 'ok');

  const metrics = await route('GET', '/internal/metrics');
  assert.equal(metrics.status, 200);
  assert.ok(Array.isArray((metrics.body as Record<string, unknown>).summaries));
});

test('VenueMind HTTP routes require the internal bearer token', async () => {
  const response = await route('GET', '/v1/venues', false);
  assert.equal(response.status, 401);
});

async function route(method: string, path: string, authorized = true) {
  const req = {
    method,
    headers: authorized ? { authorization: 'Bearer test-token' } : {},
    socket: { remoteAddress: '127.0.0.1' },
  } as IncomingMessage;
  return handleVenueMindRoute(req, new URL(path, 'http://venuemind.local'), config);
}
