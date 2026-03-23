import { estimateCurrentFootfall, getCurrentFootfall } from '../footfall';

const PEAK_VISITORS = 3_900;

function makeDate(hour: number): Date {
  const d = new Date('2026-03-11T00:00:00');
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe('estimateCurrentFootfall', () => {
  it('returns 0 when mall is closed (00–09)', () => {
    for (let h = 0; h <= 9; h++) {
      expect(estimateCurrentFootfall(makeDate(h)).currentVisitors).toBe(0);
    }
  });

  it('returns 0 when mall is closed (22–23)', () => {
    for (let h = 22; h <= 23; h++) {
      expect(estimateCurrentFootfall(makeDate(h)).currentVisitors).toBe(0);
    }
  });

  it('peaks at hour 15', () => {
    const peak = estimateCurrentFootfall(makeDate(15)).currentVisitors;
    const morning = estimateCurrentFootfall(makeDate(11)).currentVisitors;
    const evening = estimateCurrentFootfall(makeDate(20)).currentVisitors;
    expect(peak).toBeGreaterThan(morning);
    expect(peak).toBeGreaterThan(evening);
  });

  it('never exceeds PEAK_VISITORS', () => {
    for (let h = 0; h < 24; h++) {
      expect(estimateCurrentFootfall(makeDate(h)).currentVisitors).toBeLessThanOrEqual(PEAK_VISITORS);
    }
  });

  it('returns non-negative values for all hours', () => {
    for (let h = 0; h < 24; h++) {
      expect(estimateCurrentFootfall(makeDate(h)).currentVisitors).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns PEAK_VISITORS as peakEstimate', () => {
    expect(estimateCurrentFootfall(makeDate(15)).peakEstimate).toBe(PEAK_VISITORS);
  });

  it('returns weatherBoost of 0 (no live weather adjustment)', () => {
    expect(estimateCurrentFootfall(makeDate(14)).weatherBoost).toBe(0);
  });
});

describe('getCurrentFootfall', () => {
  it('returns a non-negative currentVisitors', () => {
    expect(getCurrentFootfall().currentVisitors).toBeGreaterThanOrEqual(0);
  });

  it('returns vsPlanned and weatherBoost as numbers', () => {
    const f = getCurrentFootfall();
    expect(typeof f.vsPlanned).toBe('number');
    expect(typeof f.weatherBoost).toBe('number');
  });

  it('returns positive dwellTimeMinutes', () => {
    expect(getCurrentFootfall().dwellTimeMinutes).toBeGreaterThan(0);
  });

  it('returns a positive conversionRate', () => {
    expect(getCurrentFootfall().conversionRate).toBeGreaterThan(0);
  });

  it('varies dwell time by hour', () => {
    const morning = getCurrentFootfall(makeDate(10)).dwellTimeMinutes;  // 58
    const peak = getCurrentFootfall(makeDate(15)).dwellTimeMinutes;     // 42
    expect(morning).toBeGreaterThan(peak);
  });

  it('varies conversion rate by hour', () => {
    const shoulder = getCurrentFootfall(makeDate(10)).conversionRate;   // 18.2
    const peak = getCurrentFootfall(makeDate(15)).conversionRate;       // 26.0
    expect(peak).toBeGreaterThan(shoulder);
  });

  it('returns defaults outside opening hours', () => {
    const closed = getCurrentFootfall(makeDate(3));
    expect(closed.dwellTimeMinutes).toBe(47);
    expect(closed.conversionRate).toBe(23.4);
  });
});
