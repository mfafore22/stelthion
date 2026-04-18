import { z } from 'zod';

// Profile shape is engine-internal; policy is threshold config consumed by PolicyEngine.
export const SeedSourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  url: z.string(),
  language: z.string(),
  weight: z.number().default(1),
});

export const MarketProfileSchema = z.object({
  displayName: z.string(),
  industryFocus: z.string(),
  language: z.string(),
  persona: z.string(),
  categoryKeywords: z.record(z.string(), z.array(z.string())).default({}),
  relevanceKeywords: z.array(z.string()).default([]),
  weightPriors: z.record(z.string(), z.number()).default({}),
  seedSources: z.array(SeedSourceSchema).default([]),
});

export const MarketPolicySchema = z.object({
  version: z.literal(1),
  // thresholds keyed by `${type}:${axis}:${scope}`, e.g. "TREND:composite:COUNTRY"
  thresholds: z.record(
    z.string(),
    z.object({
      publish: z.number(),
      review: z.number(),
      reject: z.number(),
    }),
  ),
  lifecycleModifiers: z
    .object({
      UPCOMING: z.number().default(-0.1),
      ACTIVE: z.number().default(0),
      CONCLUDED: z.number().default(0.2),
    })
    .default({ UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 }),
});

export const MarketSchema = z.object({
  id: z.string().min(1),
  country: z.string().length(2),
  region: z.string().nullable().optional(),
  displayName: z.string(),
  industryFocus: z.string(),
  geoAnchorLat: z.number().nullable().optional(),
  geoAnchorLon: z.number().nullable().optional(),
  footTrafficSubs: z.array(z.string()),
  culturalSubs: z.array(z.string()),
  footTrafficAxisWeight: z.number().min(0).max(1).default(0.5),
  culturalAxisWeight: z.number().min(0).max(1).default(0.5),
  profile: MarketProfileSchema,
  policy: MarketPolicySchema,
  active: z.boolean().default(true),
});

export type MarketConfig = z.infer<typeof MarketSchema>;
export type MarketProfile = z.infer<typeof MarketProfileSchema>;
export type MarketPolicy = z.infer<typeof MarketPolicySchema>;
