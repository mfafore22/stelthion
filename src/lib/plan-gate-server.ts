import prisma from '@/app/lib/prisma';
import { parsePlanFeatures, type PlanFeatures } from '@/lib/plan-gate';

const DEFAULT_FEATURES: PlanFeatures = {
  shoppermind: false,
  edgeVision: false,
  concierge: false,
  spaceAllocation: false,
  venueMind: false,
  maxMalls: 1,
  maxVenues: 1,
};

export async function getSessionPlanFeatures(
  userId: string | null | undefined,
): Promise<PlanFeatures> {
  if (!userId) return DEFAULT_FEATURES;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { customer: { select: { plan: { select: { features: true } } } } },
  });
  return parsePlanFeatures(user?.customer?.plan?.features);
}
