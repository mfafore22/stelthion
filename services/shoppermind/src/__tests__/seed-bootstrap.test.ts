import { describe, it, expect } from 'vitest';
import { BOOTSTRAP_TRENDS, BOOTSTRAP_EPOCH } from '../../data/trend-bootstrap/2026-q1/trends.js';
import { TREND_DOMAINS, inferDomainsFromText, TrendDomain } from '../engine/taxonomy/domains.js';

const STRONG_WEIGHT = 0.7;
const VALID_STATES = ['EMERGING', 'ACCELERATING', 'STABLE', 'FADING', 'DORMANT'] as const;
const LANGS = ['en', 'fi', 'sv'] as const;

describe('bootstrap dataset', () => {
  it('uses the expected epoch tag', () => {
    expect(BOOTSTRAP_EPOCH).toBe('2026-q1');
  });

  it('has at least 17 trends covering every TrendDomain', () => {
    expect(BOOTSTRAP_TRENDS.length).toBeGreaterThanOrEqual(17);
    const seen = new Set(BOOTSTRAP_TRENDS.map((t) => t.domain));
    for (const d of TREND_DOMAINS) {
      expect(seen.has(d), `missing bootstrap row for domain ${d}`).toBe(true);
    }
  });

  it('has unique trend ids', () => {
    const ids = BOOTSTRAP_TRENDS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('satisfies the composite-source gate (≥2 strong sources per trend)', () => {
    for (const t of BOOTSTRAP_TRENDS) {
      const strong = t.sources.filter((s) => s.weight >= STRONG_WEIGHT).length;
      expect(strong, `trend "${t.id}" has only ${strong} strong source(s)`).toBeGreaterThanOrEqual(2);
    }
  });

  it('has fully populated en/fi/sv translations for label, summary, mallImpact, groceryImpact', () => {
    for (const t of BOOTSTRAP_TRENDS) {
      for (const lang of LANGS) {
        expect(t.label[lang]?.length, `${t.id}.label.${lang}`).toBeGreaterThan(0);
        expect(t.summary[lang]?.length, `${t.id}.summary.${lang}`).toBeGreaterThan(20);
        expect(t.mallImpact[lang]?.length, `${t.id}.mallImpact.${lang}`).toBeGreaterThan(0);
        expect(t.groceryImpact[lang]?.length, `${t.id}.groceryImpact.${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses valid PhenomenonState values for every market status', () => {
    for (const t of BOOTSTRAP_TRENDS) {
      for (const [country, state] of Object.entries(t.marketStatus)) {
        expect(VALID_STATES, `${t.id}.${country}=${state}`).toContain(state);
      }
    }
  });

  it('flags exactly the documented surprise signals', () => {
    const surprises = BOOTSTRAP_TRENDS.filter((t) => t.surprise).map((t) => t.id).sort();
    expect(surprises).toEqual(
      ['challenger-brands', 'genz-physical-return', 'glp1-effect', 'non-alcoholic-bev', 'retail-concentration'].sort(),
    );
  });
});

describe('TrendDomain keyword inference', () => {
  it('infers GLP1_EFFECT from Ozempic copy', () => {
    const hits = inferDomainsFromText({ description: 'GLP-1 medications like Ozempic and Wegovy reshape grocery baskets.' });
    expect(hits).toContain(TrendDomain.GLP1_EFFECT);
  });

  it('infers PRIVATE_LABEL from store-brand copy', () => {
    const hits = inferDomainsFromText({ keywords: ['private label', 'own brand'] });
    expect(hits).toContain(TrendDomain.PRIVATE_LABEL);
  });

  it('returns empty array when no domain keyword matches', () => {
    expect(inferDomainsFromText({ label: 'Random unrelated headline' })).toEqual([]);
  });
});
