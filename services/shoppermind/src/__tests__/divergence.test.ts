import { describe, it, expect } from 'vitest';
import { detectDivergence } from '../engine/insights/divergence.js';

describe('detectDivergence', () => {
  it('flags markets where one is accelerating and another is fading', () => {
    const verdict = detectDivergence([
      { marketId: 'fi', state: 'ACCELERATING' },
      { marketId: 'us', state: 'STABLE' },
      { marketId: 'ae', state: 'FADING' },
    ]);
    expect(verdict.divergent).toBe(true);
    expect(verdict.contrasts[0]).toEqual({ accelerating: ['fi'], fading: ['ae'] });
  });

  it('does not flag when fewer than 3 markets are observed', () => {
    const verdict = detectDivergence([
      { marketId: 'fi', state: 'ACCELERATING' },
      { marketId: 'ae', state: 'FADING' },
    ]);
    expect(verdict.divergent).toBe(false);
  });

  it('does not flag when no fading market exists', () => {
    const verdict = detectDivergence([
      { marketId: 'fi', state: 'ACCELERATING' },
      { marketId: 'us', state: 'ACCELERATING' },
      { marketId: 'ae', state: 'STABLE' },
    ]);
    expect(verdict.divergent).toBe(false);
  });

  it('treats EMERGING as the accelerating side', () => {
    const verdict = detectDivergence([
      { marketId: 'fi', state: 'EMERGING' },
      { marketId: 'us', state: 'STABLE' },
      { marketId: 'ae', state: 'DORMANT' },
    ]);
    expect(verdict.divergent).toBe(true);
  });
});
