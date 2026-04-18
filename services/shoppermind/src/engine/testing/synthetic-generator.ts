import type { RawSignalInput } from '../types.js';

export type ScenarioShape = 'TREND_ARC' | 'EVENT_BURST' | 'INCIDENT_SPIKE' | 'CAMPAIGN_WAVE';

export interface SyntheticScenario {
  /** Distinguishes the shape of the velocity curve. */
  shape: ScenarioShape;
  /** Human-readable label used for phenomenon label + signal title prefixes. */
  label: string;
  /** Seed keywords that drive clustering + classifier + link-inferrer. */
  keywords: string[];
  /** Source country; becomes `RawSignalInput.country`. */
  country: string;
  /** Source language; becomes `RawSignalInput.language`. */
  language: string;
  /**
   * Free-text fragment appended to each signal's title/summary. Useful when
   * the test wants the gazetteer to hit on a specific place (e.g. "Lempäälä").
   */
  localeText?: string;
  /** Peak signal count (at the peakDay for bursts, at the latest day for arcs). */
  peakVolume: number;
  /** Total window in days. */
  windowDays: number;
  /** Day within the window where the peak occurs. Defaults to windowDays-1 for ARCs, windowDays/2 for bursts. */
  peakDay?: number;
}

function volumeAt(shape: ScenarioShape, peakVolume: number, day: number, peakDay: number, windowDays: number): number {
  if (shape === 'TREND_ARC') {
    // Linear ramp from 10% of peak to peak across the window.
    const t = Math.min(1, Math.max(0, day / Math.max(1, windowDays - 1)));
    return Math.max(1, Math.round(peakVolume * (0.1 + 0.9 * t)));
  }
  if (shape === 'EVENT_BURST') {
    // Narrow gaussian around peakDay.
    const sigma = Math.max(1, windowDays / 6);
    const exp = Math.exp(-((day - peakDay) ** 2) / (2 * sigma * sigma));
    return Math.max(0, Math.round(peakVolume * exp));
  }
  if (shape === 'INCIDENT_SPIKE') {
    // Sharp spike at peakDay, zero outside a 2-day window.
    if (day === peakDay) return peakVolume;
    if (Math.abs(day - peakDay) === 1) return Math.round(peakVolume * 0.3);
    return 0;
  }
  // CAMPAIGN_WAVE — plateau for a few days then fades
  const inWindow = day >= peakDay - 2 && day <= peakDay + 2;
  if (inWindow) return peakVolume;
  if (Math.abs(day - peakDay) <= 5) return Math.round(peakVolume * 0.4);
  return 0;
}

/**
 * Generate a list of RawSignalInput rows that describe a synthetic scenario.
 * Deterministic given the inputs — test harnesses can assert phenomenon
 * metrics and gate decisions byte-for-byte.
 */
export function generateSignals(
  scenario: SyntheticScenario,
  scenarioStart: Date,
): RawSignalInput[] {
  const out: RawSignalInput[] = [];
  const peakDay =
    scenario.peakDay ??
    (scenario.shape === 'TREND_ARC'
      ? scenario.windowDays - 1
      : Math.floor(scenario.windowDays / 2));

  for (let day = 0; day < scenario.windowDays; day++) {
    const count = volumeAt(
      scenario.shape,
      scenario.peakVolume,
      day,
      peakDay,
      scenario.windowDays,
    );
    const base = new Date(scenarioStart.getTime() + day * 86_400_000);
    for (let i = 0; i < count; i++) {
      const publishedAt = new Date(base.getTime() + i * 60_000);
      const title = [scenario.label, scenario.localeText, `update ${i + 1}`]
        .filter(Boolean)
        .join(' — ');
      const summary = scenario.keywords.join(', ');
      out.push({
        externalId: `${scenario.label}-d${day}-i${i}`,
        title,
        summary,
        country: scenario.country,
        language: scenario.language,
        publishedAt,
      });
    }
  }
  return out;
}
