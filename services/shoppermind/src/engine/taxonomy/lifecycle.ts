import type { LifecycleState } from '../policy/policy-types.js';

export interface LifecycleInput {
  phenomenonType: 'TREND' | 'EVENT' | 'CAMPAIGN' | 'INCIDENT';
  eventStart: Date | null;
  eventEnd: Date | null;
  fadeWindowDays?: number;
}

// Pure function: no I/O. TREND carries no lifecycle state (returns null).
export function computeLifecycle(input: LifecycleInput, now: Date): LifecycleState | null {
  if (input.phenomenonType === 'TREND') return null;
  if (!input.eventStart) return null;
  if (now < input.eventStart) return 'UPCOMING';
  const end = input.eventEnd ?? input.eventStart;
  const fadeMs = (input.fadeWindowDays ?? 7) * 24 * 60 * 60 * 1000;
  if (now <= new Date(end.getTime() + fadeMs)) {
    return now <= end ? 'ACTIVE' : 'CONCLUDED';
  }
  return 'CONCLUDED';
}
