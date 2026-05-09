import type { RuntimeActor, RuntimeScope } from './runtime.js';

export interface ScopeDecision {
  allowed: boolean;
  reasons: string[];
}

export interface ScopeGuard {
  assertAccessible(scope: RuntimeScope, actor: RuntimeActor): ScopeDecision;
}

export class DefaultScopeGuard implements ScopeGuard {
  assertAccessible(scope: RuntimeScope, actor: RuntimeActor): ScopeDecision {
    const reasons: string[] = [];
    if (scope.customerId && !actor.customerScopes.includes(scope.customerId)) {
      reasons.push('customer_scope_denied');
    }
    if (scope.marketId && !actor.marketScopes?.includes(scope.marketId)) {
      reasons.push('market_scope_denied');
    }
    if (scope.propertyId && !actor.propertyScopes?.includes(scope.propertyId)) {
      reasons.push('property_scope_denied');
    }
    if (scope.venueId && !actor.venueScopes?.includes(scope.venueId)) {
      reasons.push('venue_scope_denied');
    }
    return { allowed: reasons.length === 0, reasons };
  }
}
