// Reusable macro-indicator sync logic. Idempotent upserts into
// MacroIndicatorPoint. Called from both the CLI script
// (scripts/sync-macro-indicators.ts) and the cron API route
// (src/app/api/cron/macro-sync/route.ts).

import { fetchStatFin, type StatFinPoint } from './statfin';
import {
  FI_INDICATORS,
  SE_INDICATORS,
  US_INDICATORS,
  UAE_INDICATORS,
  type FredQuery,
  type MacroFetch,
  type MacroIndicatorMeta,
} from './macro-indicators';
import type { PrismaClient } from '@prisma/client';

const ALL_INDICATORS: MacroIndicatorMeta[] = [...FI_INDICATORS, ...SE_INDICATORS, ...US_INDICATORS, ...UAE_INDICATORS];

export interface SyncResult { code: string; count: number; error: string | null; skipped?: boolean }
export interface SyncSummary { ok: number; failed: number; skipped: number; results: SyncResult[] }

export async function syncOneIndicator(prisma: PrismaClient, meta: MacroIndicatorMeta): Promise<SyncResult> {
  try {
    const points = meta.fetch
      ? await fetchPoints(meta.fetch)
      : (meta.fallbackHistory ?? []).map((p) => ({
          period: p.period,
          value: p.value,
          periodDate: new Date(p.periodDate),
        }));
    if (!meta.fetch && points.length === 0) {
      return { code: meta.code, count: 0, error: null, skipped: true };
    }
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
  const fredIndicators = list.filter((indicator) => indicator.fetch?.provider === 'fred');
  const otherIndicators = list.filter((indicator) => indicator.fetch?.provider !== 'fred');
  const results = await Promise.all(otherIndicators.map((m) => syncOneIndicator(prisma, m)));
  for (const indicator of fredIndicators) {
    if (results.length > 0) await sleep(200);
    results.push(await syncOneIndicator(prisma, indicator));
  }
  const failed = results.filter((r) => r.error !== null).length;
  const skipped = results.filter((r) => r.skipped).length;
  return { ok: results.length - failed - skipped, failed, skipped, results };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPoints(fetchConfig: MacroFetch): Promise<StatFinPoint[]> {
  switch (fetchConfig.provider) {
    case 'pxweb':
      return (await fetchStatFin(fetchConfig.query)).points;
    case 'fred':
      return fetchFred(fetchConfig.query);
    case 'derived-debt-to-gdp':
      return fetchDebtToGdp(fetchConfig);
  }
}

async function fetchFred(q: FredQuery): Promise<StatFinPoint[]> {
  const res = await fetch(q.url, {
    headers: { 'User-Agent': 'ShopperMind/1.0 (+stelthion.ai)' },
  });
  if (!res.ok) throw new Error(`FRED ${q.seriesId} ${res.status}: ${res.statusText}`);

  const text = await res.text();
  const lines = text.trim().split(/\r?\n/).slice(1);
  const points: StatFinPoint[] = [];
  for (const line of lines) {
    const [date, rawValue] = line.split(',');
    const value = Number(rawValue);
    if (!date || !Number.isFinite(value)) continue;
    const parsed = q.pickPeriod(date);
    if (!parsed) continue;
    points.push({ ...parsed, value });
  }
  return points;
}

async function fetchDebtToGdp(q: Extract<MacroFetch, { provider: 'derived-debt-to-gdp' }>): Promise<StatFinPoint[]> {
  const [debtResult, gdpResult] = await Promise.all([
    fetchStatFin(q.debtQuery),
    fetchStatFin(q.gdpQuery),
  ]);
  const gdpByPeriod = new Map(gdpResult.points.map((point) => [point.period, point]));

  return debtResult.points.flatMap((debtPoint) => {
    const gdpPoint = gdpByPeriod.get(debtPoint.period);
    const annualizedGdp = (gdpPoint?.value ?? 0) * q.gdpAnnualizationFactor;
    if (!Number.isFinite(annualizedGdp) || annualizedGdp <= 0) return [];
    const value = (debtPoint.value / annualizedGdp) * 100;
    return [{ ...debtPoint, value }];
  });
}
