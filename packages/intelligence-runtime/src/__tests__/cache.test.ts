import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCacheKey, cacheTags, type CacheAddress } from '../cache.js';

const address: CacheAddress = {
  domain: 'shoppermind',
  layer: 'overview',
  scope: {
    customerId: 'customer-a',
    marketId: 'helsinki-fi',
    propertyId: 'realidea-sello',
    locale: 'fi',
  },
};

test('buildCacheKey produces stable scoped keys', () => {
  assert.equal(
    buildCacheKey(address),
    'stelthion:shoppermind:overview:customer-a:helsinki-fi:realidea-sello:index:fi',
  );
});

test('buildCacheKey falls back to global and default locale', () => {
  assert.equal(
    buildCacheKey({ domain: 'venuemind', layer: 'detail', scope: {} }),
    'stelthion:venuemind:detail:global:index:default',
  );
});

test('cacheTags returns invalidation tags for populated scope fields', () => {
  assert.deepEqual(cacheTags(address), [
    'shoppermind:overview',
    'customer:customer-a',
    'market:helsinki-fi',
    'property:realidea-sello',
  ]);
});

test('cacheTags includes venue tags without empty placeholders', () => {
  assert.deepEqual(
    cacheTags({
      domain: 'venuemind',
      layer: 'agent_context',
      scope: { customerId: 'customer-b', venueId: 'arena-33' },
    }),
    ['venuemind:agent_context', 'customer:customer-b', 'venue:arena-33'],
  );
});
