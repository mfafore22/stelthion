export type PlanFeatures = {
  shoppermind: boolean;
  edgeVision: boolean;
  concierge: boolean;
  spaceAllocation: boolean;
  maxMalls: number;
};

const DEFAULT_FEATURES: PlanFeatures = {
  shoppermind: false,
  edgeVision: false,
  concierge: false,
  spaceAllocation: false,
  maxMalls: 1,
};

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  if (!raw || typeof raw !== 'object') return DEFAULT_FEATURES;
  const f = raw as Record<string, unknown>;
  return {
    shoppermind: Boolean(f.shoppermind),
    edgeVision: Boolean(f.edgeVision),
    concierge: Boolean(f.concierge),
    spaceAllocation: Boolean(f.spaceAllocation),
    maxMalls: typeof f.maxMalls === 'number' ? f.maxMalls : 1,
  };
}

export function hasFeature(
  features: PlanFeatures | null | undefined,
  feature: keyof Omit<PlanFeatures, 'maxMalls'>,
): boolean {
  return features?.[feature] ?? false;
}
