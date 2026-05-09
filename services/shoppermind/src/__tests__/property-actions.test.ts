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

  it('localizes Sello action content for Finnish sessions', () => {
    const result = getPropertyActions('realidea-sello', 'helsinki-fi');
    const recommendation = result?.recommendations.find((item) => item.id === 'sello-service-frequency');

    expect(result?.property.summary).toContain('Alueellinen arjen asiointikeskus');
    expect(recommendation?.title).toBe('Muuta palvelutarjonta viikoittaiseksi asiointirutiiniksi');
    expect(recommendation?.action).toContain('Rakenna viikoittaiset asiointitehtävät');
    expect(recommendation?.action).not.toContain('Create weekly service missions');
    expect(recommendation?.competitorExamples[0]?.observedMove).toContain('käyntijärjestelmänä');
    expect(result?.evidenceClaims.find((claim) => claim.id === 'claim-sello-160-stores')?.text)
      .toContain('Sello kertoo');
  });

  it('keeps Sello Finnish even if the caller sends English language state', () => {
    const result = getPropertyActions('realidea-sello', 'helsinki-fi', 'en');
    const recommendation = result?.recommendations.find((item) => item.id === 'sello-service-frequency');

    expect(recommendation?.title).toBe('Muuta palvelutarjonta viikoittaiseksi asiointirutiiniksi');
    expect(recommendation?.action).not.toContain('Create weekly service missions');
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
