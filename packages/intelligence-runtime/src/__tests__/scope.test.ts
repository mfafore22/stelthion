import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultScopeGuard } from '../scope.js';
import type { RuntimeActor, RuntimeScope } from '../runtime.js';

const guard = new DefaultScopeGuard();

test('DefaultScopeGuard denies requested optional scopes when actor lists are missing', () => {
  const actor: RuntimeActor = {
    id: 'user-1',
    role: 'operator',
    customerScopes: ['customer-a'],
  };
  const scope: RuntimeScope = {
    customerId: 'customer-a',
    marketId: 'helsinki-fi',
    propertyId: 'realidea-sello',
    venueId: 'arena-33',
  };

  const result = guard.assertAccessible(scope, actor);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.reasons, [
    'market_scope_denied',
    'property_scope_denied',
    'venue_scope_denied',
  ]);
});

test('DefaultScopeGuard allows all requested scopes when explicitly granted', () => {
  const actor: RuntimeActor = {
    id: 'user-1',
    role: 'operator',
    customerScopes: ['customer-a'],
    marketScopes: ['helsinki-fi'],
    propertyScopes: ['realidea-sello'],
    venueScopes: ['arena-33'],
  };

  const result = guard.assertAccessible({
    customerId: 'customer-a',
    marketId: 'helsinki-fi',
    propertyId: 'realidea-sello',
    venueId: 'arena-33',
  }, actor);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.reasons, []);
});

test('DefaultScopeGuard denies customer scope mismatches', () => {
  const actor: RuntimeActor = {
    id: 'user-1',
    role: 'operator',
    customerScopes: ['customer-a'],
  };

  const result = guard.assertAccessible({ customerId: 'customer-b' }, actor);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.reasons, ['customer_scope_denied']);
});
