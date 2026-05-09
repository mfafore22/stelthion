export type PlanFeatures = {
  shoppermind: boolean;
  edgeVision: boolean;
  concierge: boolean;
  spaceAllocation: boolean;
  venueMind: boolean;
  maxMalls: number;
  maxVenues: number;
};

const DEFAULT_FEATURES: PlanFeatures = {
  shoppermind: false,
  edgeVision: false,
  concierge: false,
  spaceAllocation: false,
  venueMind: false,
  maxMalls: 1,
  maxVenues: 1,
};

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  if (!raw || typeof raw !== 'object') return DEFAULT_FEATURES;
  const f = raw as Record<string, unknown>;
  return {
    shoppermind: Boolean(f.shoppermind),
    edgeVision: Boolean(f.edgeVision),
    concierge: Boolean(f.concierge),
    spaceAllocation: Boolean(f.spaceAllocation),
    venueMind: Boolean(f.venueMind),
    maxMalls: typeof f.maxMalls === 'number' ? f.maxMalls : 1,
    maxVenues: typeof f.maxVenues === 'number' ? f.maxVenues : 1,
  };
}

export function hasFeature(
  features: PlanFeatures | null | undefined,
  feature: keyof Omit<PlanFeatures, 'maxMalls' | 'maxVenues'>,
): boolean {
  return features?.[feature] ?? false;
}
