import { describe, it, expect } from 'vitest';
import { classifyMarketState } from '../engine/insights/per-market-state.js';

describe('classifyMarketState', () => {
  it('classifies bootstrap ACCELERATING shape', () => {
    expect(classifyMarketState({ volume: 60, velocity: 0.6, acceleration: 0.1 })).toBe('ACCELERATING');
  });

  it('classifies bootstrap EMERGING shape', () => {
    expect(classifyMarketState({ volume: 25, velocity: 0.35, acceleration: 0.06 })).toBe('EMERGING');
  });

  it('classifies bootstrap STABLE shape', () => {
    expect(classifyMarketState({ volume: 35, velocity: 0.12, acceleration: 0 })).toBe('STABLE');
  });

  it('classifies bootstrap FADING shape', () => {
    expect(classifyMarketState({ volume: 18, velocity: -0.1, acceleration: -0.08 })).toBe('FADING');
  });

  it('classifies bootstrap DORMANT shape', () => {
    expect(classifyMarketState({ volume: 5, velocity: -0.03, acceleration: -0.01 })).toBe('DORMANT');
  });
});
