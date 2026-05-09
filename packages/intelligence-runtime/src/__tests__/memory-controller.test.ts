import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryController } from '../memory-controller.js';
import { InMemoryMemoryPort } from '../memory-store.js';
import type { MemoryDocument } from '../memory.js';
import type { RuntimeActor } from '../runtime.js';

const actor: RuntimeActor = {
  id: 'operator-1',
  role: 'operator',
  customerScopes: ['customer-a'],
  marketScopes: ['helsinki-fi'],
};

test('MemoryController writes and searches scoped memory documents', async () => {
  const controller = new MemoryController(new InMemoryMemoryPort());
  await controller.upsert(doc('doc-1', 'retrieval', 'passive housing signal'), actor);
  await controller.upsert(doc('doc-2', 'background_context', 'older retail context'), actor);

  const results = await controller.search({
    domain: 'shoppermind',
    tier: 'retrieval',
    scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    query: 'passive',
  }, actor);

  assert.deepEqual(results.map((result) => result.id), ['doc-1']);
});

test('MemoryController prunes expired documents', async () => {
  const port = new InMemoryMemoryPort();
  const controller = new MemoryController(port);
  await controller.upsert({ ...doc('old', 'ui_cache', 'stale'), expiresAt: '2026-05-01T00:00:00Z' }, actor);
  await controller.upsert(doc('fresh', 'ui_cache', 'fresh'), actor);

  assert.equal(await controller.deleteExpired(new Date('2026-05-07T00:00:00Z')), 1);
  const remaining = await port.search({ domain: 'shoppermind', scope: { customerId: 'customer-a' } });
  assert.deepEqual(remaining.map((result) => result.id), ['fresh']);
});

function doc(id: string, tier: MemoryDocument['tier'], body: string): MemoryDocument {
  return {
    id,
    domain: 'shoppermind',
    tier,
    scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    title: id,
    body,
    sourceIds: ['source-1'],
    entityIds: ['phenomenon-1'],
    freshnessAt: '2026-05-07T00:00:00Z',
    sensitivity: 'public',
  };
}
