import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { getIndicatorsForCountry } from '@/lib/shoppermind/macro-indicators';

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
    const series = (byCode.get(m.code) ?? []).slice(0, 24).reverse();
    const latest = series.length > 0 ? series[series.length - 1] : null;
    const langKey = (lang === 'fi' || lang === 'sv') ? lang : 'en';
    return {
      slot: m.slot,
      code: m.code,
      name: m.i18n[langKey],
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
