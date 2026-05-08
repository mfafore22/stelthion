import { describe, expect, it } from 'vitest';
import {
  buildPropertyActionLLMContext,
  getPropertyActions,
  listVerifiedClaims,
} from '../engine/actions/property-actions.js';

describe('property action recommendations', () => {
  it('returns market-scoped recommendations with verified evidence', () => {
    const result = getPropertyActions('realidea-tripla', 'helsinki-fi');

    expect(result).not.toBeNull();
    expect(result?.property.marketId).toBe('helsinki-fi');
    expect(result?.recommendations.length).toBeGreaterThanOrEqual(3);
    for (const recommendation of result?.recommendations ?? []) {
      expect(recommendation.marketId).toBe('helsinki-fi');
      expect(recommendation.verificationStatus).toBe('verified');
      expect(recommendation.evidenceClaimIds.length).toBeGreaterThan(0);
      expect(recommendation.competitorExamples.length).toBeGreaterThan(0);
      for (const competitor of recommendation.competitorExamples) {
        expect(competitor.evidenceClaimIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('does not leak actions across market boundaries', () => {
    expect(getPropertyActions('realidea-tripla', 'dubai-ae')).toBeNull();
  });

  it('builds LLM context only from verified claims', () => {
    const claims = listVerifiedClaims();
    const result = getPropertyActions('realidea-tripla', 'helsinki-fi');
    const context = buildPropertyActionLLMContext(result?.recommendations ?? [], claims);
    const verifiedIds = new Set(claims.map((claim) => claim.id));

    expect(context.enabled).toBe(false);
    expect(context.citationIds.length).toBeGreaterThan(0);
    for (const id of context.citationIds) {
      expect(verifiedIds.has(id)).toBe(true);
    }
  });
});
