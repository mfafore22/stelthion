// Reusable macro-indicator sync logic. Idempotent upserts into
// MacroIndicatorPoint. Called from both the CLI script
// (scripts/sync-macro-indicators.ts) and the cron API route
// (src/app/api/cron/macro-sync/route.ts).

import { fetchStatFin } from './statfin';
import { FI_INDICATORS, SE_INDICATORS, type MacroIndicatorMeta } from './macro-indicators';
import type { PrismaClient } from '@prisma/client';

const ALL_INDICATORS: MacroIndicatorMeta[] = [...FI_INDICATORS, ...SE_INDICATORS];

export interface SyncResult { code: string; count: number; error: string | null }
export interface SyncSummary { ok: number; failed: number; results: SyncResult[] }

export async function syncOneIndicator(prisma: PrismaClient, meta: MacroIndicatorMeta): Promise<SyncResult> {
  try {
    const { points } = await fetchStatFin(meta.fetch);
    if (points.length === 0) return { code: meta.code, count: 0, error: 'no-points' };
    let upserted = 0;
    for (const p of points) {
      await prisma.macroIndicatorPoint.upsert({
        where: { indicatorCode_period: { indicatorCode: meta.code, period: p.period } },
        update: { value: p.value, periodDate: p.periodDate, fetchedAt: new Date() },
        create: {
          indicatorCode: meta.code,
          country: meta.country,
          period: p.period,
          periodDate: p.periodDate,
          value: p.value,
        },
      });
      upserted++;
    }
    return { code: meta.code, count: upserted, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { code: meta.code, count: 0, error: msg };
  }
}

export async function syncAllIndicators(prisma: PrismaClient, onlyCode?: string): Promise<SyncSummary> {
  const list = onlyCode ? ALL_INDICATORS.filter((i) => i.code === onlyCode) : ALL_INDICATORS;
  const results = await Promise.all(list.map((m) => syncOneIndicator(prisma, m)));
  const ok = results.filter((r) => r.error === null).length;
  return { ok, failed: results.length - ok, results };
}
