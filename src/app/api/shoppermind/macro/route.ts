import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { getIndicatorsForCountry } from '@/lib/shoppermind/macro-indicators';
import { syncOneIndicator } from '@/lib/shoppermind/sync-macro';

export const revalidate = 3600; // 1 hour

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const country = (req.nextUrl.searchParams.get('country') ?? 'FI').toUpperCase();
  const lang = req.nextUrl.searchParams.get('lang') ?? 'fi';
  const meta = getIndicatorsForCountry(country);
  if (meta.length === 0) {
    return NextResponse.json({ country, indicators: [] });
  }

  const codes = meta.map((m) => m.code);
  if (process.env.NODE_ENV !== 'production') {
    await refreshStaleLocalIndicators(codes, meta);
  }

  const rows = await prisma.macroIndicatorPoint.findMany({
    where: { indicatorCode: { in: codes } },
    orderBy: { periodDate: 'desc' },
    take: 24 * codes.length, // up to 24 points per indicator
  });

  const byCode = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = byCode.get(r.indicatorCode) ?? [];
    arr.push(r);
    byCode.set(r.indicatorCode, arr);
  }

  const indicators = meta.map((m) => {
    const dbSeries = (byCode.get(m.code) ?? []).slice(0, 24).reverse();
    const series = dbSeries.length > 0
      ? dbSeries
      : (m.fallbackHistory ?? []).map((p) => ({
          indicatorCode: m.code,
          country: m.country,
          period: p.period,
          periodDate: new Date(p.periodDate),
          value: p.value,
          fetchedAt: new Date('2026-05-03T00:00:00.000Z'),
        }));
    const latest = series.length > 0 ? series[series.length - 1] : null;
    const langKey = (lang === 'fi' || lang === 'sv') ? lang : 'en';
    return {
      slot: m.slot,
      code: m.code,
      name: m.i18n[langKey],
      scaleNote: m.scaleNote?.[langKey] ?? null,
      unit: m.unit,
      cadence: m.cadence,
      publisher: m.publisher,
      sourceUrl: m.sourceUrl,
      latestValue: latest?.value ?? null,
      latestPeriod: latest?.period ?? null,
      fetchedAt: latest?.fetchedAt ?? null,
      history: series.map((p) => ({ period: p.period, value: p.value })),
    };
  });

  return NextResponse.json({ country, indicators });
}

async function refreshStaleLocalIndicators(
  codes: string[],
  meta: ReturnType<typeof getIndicatorsForCountry>,
) {
  const existing = await prisma.macroIndicatorPoint.groupBy({
    by: ['indicatorCode'],
    where: { indicatorCode: { in: codes } },
    _max: { fetchedAt: true },
  });
  const latestByCode = new Map(existing.map((row) => [row.indicatorCode, row._max.fetchedAt]));
  const staleBefore = Date.now() - 6 * 60 * 60 * 1000;
  const stale = meta.filter((indicator) => {
    const latest = latestByCode.get(indicator.code);
    return !latest || latest.getTime() < staleBefore;
  });
  if (stale.length === 0) return;
  await Promise.all(stale.map((indicator) => syncOneIndicator(prisma, indicator)));
}
