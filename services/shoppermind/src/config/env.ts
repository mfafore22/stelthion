import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SHOPPERMIND_SERVICE_TOKEN: z.string().min(16),
  SHOPPERMIND_INTERNAL_TOKEN: z.string().min(16),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  REVIEW_TTL_CRON: z.string().default('*/15 * * * *'),
  REVIEW_TTL_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
  RETENTION_CRON: z.string().default('0 3 * * *'),
  RETENTION_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
  RETENTION_SCORE_DAYS: z.coerce.number().int().positive().default(90),
  RETENTION_REVIEW_DAYS: z.coerce.number().int().positive().default(180),
  COORDINATOR_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),
  BULL_BOARD_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),
});

export type AppEnv = z.infer<typeof Env>;

let cached: AppEnv | null = null;

export function env(): AppEnv {
  if (cached) return cached;
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(details)}`);
  }
  cached = parsed.data;
  return cached;
}
