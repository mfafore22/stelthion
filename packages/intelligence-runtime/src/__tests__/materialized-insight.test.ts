import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMaterializedInsight,
  refreshMaterializedFreshness,
  retentionTtlSeconds,
} from '../materialized-insight.js';

test('createMaterializedInsight applies shared freshness policy', () => {
  const insight = createMaterializedInsight({
    domain: 'shoppermind',
    kind: 'overview',
    scope: { marketId: 'helsinki-fi' },
    value: { count: 2 },
    policy: { freshTtlMs: 1_000, retentionTtlMs: 60_000 },
    now: new Date('2026-05-07T12:00:00Z'),
  });

  assert.equal(insight.freshness, 'fresh');
  assert.equal(insight.expiresAt, '2026-05-07T12:00:01.000Z');
  assert.deepEqual(insight.value, { count: 2 });
});

test('refreshMaterializedFreshness marks expired insights stale', () => {
  const insight = createMaterializedInsight({
    domain: 'venuemind',
    kind: 'detail',
    scope: { venueId: 'arena-1' },
    value: 'value',
    policy: { freshTtlMs: 1_000, retentionTtlMs: 60_000 },
    now: new Date('2026-05-07T12:00:00Z'),
  });

  const stale = refreshMaterializedFreshness(
    insight,
    new Date('2026-05-07T12:00:02Z'),
  );
  assert.equal(stale.freshness, 'stale');
});

test('retentionTtlSeconds rounds up to preserve retention window', () => {
  assert.equal(retentionTtlSeconds({ freshTtlMs: 1, retentionTtlMs: 1_001 }), 2);
});
