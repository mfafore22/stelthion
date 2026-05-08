import { describe, it, expect } from 'vitest';
import {
  predictNextInstance,
  type HistoricalManifestation,
} from '../engine/predictive/event-predictor.js';

const trend = { id: 't1', label: 'Black Friday commercial push', phenomenonType: 'TREND' };

function manifestation(
  id: string,
  startIso: string,
  endIso: string | null,
  overrides: Partial<HistoricalManifestation> = {},
): HistoricalManifestation {
  return {
    phenomenonId: id,
    label: `instance ${id}`,
    type: 'CAMPAIGN',
    eventStart: new Date(startIso),
    eventEnd: endIso ? new Date(endIso) : null,
    linkType: 'MANIFESTATION_OF',
    linkWeight: 0.8,
    ...overrides,
  };
}

describe('predictNextInstance', () => {
  it('returns null when fewer than 2 usable manifestations', () => {
    const result = predictNextInstance(trend, [
      manifestation('m1', '2024-11-29T00:00:00Z', '2024-12-02T00:00:00Z'),
    ]);
    expect(result).toBeNull();
  });

  it('returns null when phenomenon is not a TREND', () => {
    const result = predictNextInstance(
      { id: 'e1', label: 'event', phenomenonType: 'EVENT' },
      [
        manifestation('m1', '2024-11-29T00:00:00Z', '2024-12-02T00:00:00Z'),
        manifestation('m2', '2025-11-28T00:00:00Z', '2025-12-01T00:00:00Z'),
      ],
    );
    expect(result).toBeNull();
  });

  it('projects an annual cadence from two historical instances', () => {
    const result = predictNextInstance(
      trend,
      [
        manifestation('m1', '2024-11-29T00:00:00Z', '2024-12-02T00:00:00Z'),
        manifestation('m2', '2025-11-28T00:00:00Z', '2025-12-01T00:00:00Z'),
      ],
      new Date('2026-04-19T00:00:00Z'),
    );
    expect(result).not.toBeNull();
    expect(result!.basisCount).toBe(2);
    expect(result!.cadenceDays).toBeGreaterThan(350);
    expect(result!.cadenceDays).toBeLessThan(380);
    expect(new Date(result!.expectedStart).getUTCFullYear()).toBe(2026);
    expect(result!.rationale).toContain('annual');
  });

  it('refuses to predict when cadence is wildly inconsistent', () => {
    const result = predictNextInstance(trend, [
      manifestation('m1', '2024-01-01T00:00:00Z', null),
      manifestation('m2', '2024-02-15T00:00:00Z', null),
      manifestation('m3', '2025-11-01T00:00:00Z', null),
    ]);
    expect(result).toBeNull();
  });

  it('ignores CONTRIBUTES_TO links in basis set', () => {
    const result = predictNextInstance(trend, [
      manifestation('m1', '2024-11-29T00:00:00Z', '2024-12-02T00:00:00Z', {
        linkType: 'CONTRIBUTES_TO',
      }),
      manifestation('m2', '2025-11-28T00:00:00Z', '2025-12-01T00:00:00Z', {
        linkType: 'CONTRIBUTES_TO',
      }),
    ]);
    expect(result).toBeNull();
  });

  it('confidence rises with stable cadence + higher basis count', () => {
    const tight = predictNextInstance(
      trend,
      [
        manifestation('m1', '2022-11-25T00:00:00Z', null),
        manifestation('m2', '2023-11-24T00:00:00Z', null),
        manifestation('m3', '2024-11-29T00:00:00Z', null),
        manifestation('m4', '2025-11-28T00:00:00Z', null),
      ],
      new Date('2026-04-19T00:00:00Z'),
    );
    const loose = predictNextInstance(
      trend,
      [
        manifestation('m1', '2024-11-20T00:00:00Z', null),
        manifestation('m2', '2025-11-28T00:00:00Z', null),
      ],
      new Date('2026-04-19T00:00:00Z'),
    );
    expect(tight).not.toBeNull();
    expect(loose).not.toBeNull();
    expect(tight!.confidence).toBeGreaterThan(loose!.confidence);
  });
});
