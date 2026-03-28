import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  try {
    const { mallId } = await params;
    const url = new URL(req.url);
    const week = parseInt(url.searchParams.get('week') ?? '0', 10);
    const year = parseInt(url.searchParams.get('year') ?? '0', 10);
    const counterFilter = url.searchParams.get('counter') ?? 'all';
    const format = url.searchParams.get('format') ?? 'csv';

    if (!week || !year) {
      return NextResponse.json({ error: 'week and year required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { mallId, weekNumber: week, year };
    if (counterFilter !== 'all') {
      where.counterLabel = counterFilter;
    }

    const readings = await prisma.counterReading.findMany({
      where,
      orderBy: [{ counterLabel: 'asc' }, { date: 'asc' }, { hour: 'asc' }],
    });

    if (format === 'csv') {
      const header = 'Date,Hour,Counter,Floor,Visitors,Visitors Prev Year,Delta %\n';
      const rows = readings.map((r) => {
        const date = r.date.toISOString().split('T')[0];
        const hour = r.hour >= 0 ? r.hour : '';
        const delta =
          r.visitorsPrevYear && r.visitorsPrevYear > 0
            ? (((r.visitors - r.visitorsPrevYear) / r.visitorsPrevYear) * 100).toFixed(1)
            : '';
        // Escape counter label in case it contains commas
        const label = r.counterLabel.includes(',') ? `"${r.counterLabel}"` : r.counterLabel;
        return `${date},${hour},${label},${r.floor},${r.visitors},${r.visitorsPrevYear ?? ''},${delta}`;
      });
      const csv = header + rows.join('\n');
      const filename = `counters-${mallId}-wk${week}-${year}.csv`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON fallback
    return NextResponse.json(readings);
  } catch (err) {
    console.error('[counter export]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
