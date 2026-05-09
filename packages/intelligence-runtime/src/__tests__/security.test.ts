import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRateLimit, InMemoryRateLimitStore, rateLimitKey } from '../security.js';

test('evaluateRateLimit allows requests within the window', () => {
  const first = evaluateRateLimit(undefined, { windowMs: 60_000, max: 2 }, 1000);
  const second = evaluateRateLimit(first.state, { windowMs: 60_000, max: 2 }, 2000);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
});

test('evaluateRateLimit blocks and reports retry timing', () => {
  const first = evaluateRateLimit(undefined, { windowMs: 60_000, max: 1 }, 1000);
  const second = evaluateRateLimit(first.state, { windowMs: 60_000, max: 1 }, 2000);

  assert.equal(second.allowed, false);
  assert.equal(second.retryAfterSeconds, 59);
  assert.equal(rateLimitKey('agent', 'principal-a'), 'agent:principal-a');
});

test('InMemoryRateLimitStore consumes keyed limits independently', async () => {
  const store = new InMemoryRateLimitStore();
  const policy = { windowMs: 60_000, max: 1 };

  const first = await store.consume('public:a', policy, 1000);
  const second = await store.consume('public:a', policy, 1001);
  const other = await store.consume('public:b', policy, 1002);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(other.allowed, true);
});
