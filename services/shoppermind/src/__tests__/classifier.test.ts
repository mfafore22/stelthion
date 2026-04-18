import { describe, it, expect } from 'vitest';
import { classify } from '../engine/taxonomy/classifier.js';
import { computeLifecycle } from '../engine/taxonomy/lifecycle.js';

const now = new Date('2026-04-01T00:00:00Z');

describe('classify', () => {
  it('detects INCIDENT on emergency language', () => {
    const r = classify(
      { label: 'Storm warning Tampere', description: 'severe weather, transit delay', keywords: ['storm', 'delay'] },
      now,
    );
    expect(r.type).toBe('INCIDENT');
  });
  it('detects CAMPAIGN on promotional language', () => {
    const r = classify(
      { label: 'Black Friday 2026', description: 'seasonal sale, deals week', keywords: ['black friday'] },
      now,
    );
    expect(r.type).toBe('CAMPAIGN');
    expect(r.eventStart).toBeDefined();
    expect(r.eventStart?.getUTCFullYear()).toBe(2026);
  });
  it('detects EVENT for fairs and festivals with a year hint', () => {
    const r = classify(
      { label: 'Asuntomessut Lempäälä 2026', description: 'housing fair, opening in June 2026', keywords: ['asuntomessut'] },
      now,
    );
    expect(r.type).toBe('EVENT');
    expect(r.eventStart?.getUTCFullYear()).toBe(2026);
    // June = month index 5
    expect(r.eventStart?.getUTCMonth()).toBe(5);
  });
  it('falls back to TREND for generic behaviour language', () => {
    const r = classify(
      { label: 'Rise of hybrid work', description: 'shift toward remote, long-term', keywords: ['remote work'] },
      now,
    );
    expect(r.type).toBe('TREND');
    expect(r.confidence).toBeGreaterThan(0.7);
  });
});

describe('computeLifecycle', () => {
  const mid = new Date('2026-06-10T00:00:00Z');
  it('UPCOMING before eventStart', () => {
    expect(
      computeLifecycle(
        { phenomenonType: 'EVENT', eventStart: new Date('2026-06-15T00:00:00Z'), eventEnd: null },
        mid,
      ),
    ).toBe('UPCOMING');
  });
  it('ACTIVE inside window', () => {
    expect(
      computeLifecycle(
        {
          phenomenonType: 'EVENT',
          eventStart: new Date('2026-06-08T00:00:00Z'),
          eventEnd: new Date('2026-06-12T00:00:00Z'),
        },
        mid,
      ),
    ).toBe('ACTIVE');
  });
  it('CONCLUDED after window + fade', () => {
    expect(
      computeLifecycle(
        {
          phenomenonType: 'EVENT',
          eventStart: new Date('2026-05-01T00:00:00Z'),
          eventEnd: new Date('2026-05-03T00:00:00Z'),
        },
        mid,
      ),
    ).toBe('CONCLUDED');
  });
  it('TRENDs carry no lifecycle', () => {
    expect(computeLifecycle({ phenomenonType: 'TREND', eventStart: null, eventEnd: null }, mid)).toBeNull();
  });
});
