import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheController } from '../cache-controller.js';
import { InMemoryCachePort } from '../cache-store.js';

const address = {
  domain: 'shoppermind',
  layer: 'overview',
  scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
} as const;

test('CacheController stores and retrieves typed values', async () => {
  const controller = new CacheController(new InMemoryCachePort());
  await controller.set(address, { count: 3 }, { ttlMs: 60_000 });

  assert.deepEqual(await controller.get<{ count: number }>(address), { count: 3 });
});

test('CacheController getOrSet loads only on misses', async () => {
  const controller = new CacheController(new InMemoryCachePort());
  let loads = 0;
  const first = await controller.getOrSet(address, { ttlMs: 60_000 }, async () => {
    loads++;
    return 'value';
  });
  const second = await controller.getOrSet(address, { ttlMs: 60_000 }, async () => {
    loads++;
    return 'other';
  });

  assert.equal(first, 'value');
  assert.equal(second, 'value');
  assert.equal(loads, 1);
});

test('CacheController invalidates entries by tag', async () => {
  const controller = new CacheController(new InMemoryCachePort());
  await controller.set(address, 'value', { ttlMs: 60_000 });
  assert.equal(await controller.invalidateByTag('market:helsinki-fi'), 1);
  assert.equal(await controller.get<string>(address), null);
});
