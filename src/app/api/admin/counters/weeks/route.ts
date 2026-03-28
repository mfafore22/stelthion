import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallId = new URL(req.url).searchParams.get('mallId') ?? 'ideapark-lempaala';

  try {
    // Return individual uploads so each document is visible
    const uploads = await prisma.counterUpload.findMany({
      where: { mallId },
      orderBy: { uploadedAt: 'desc' },
    });

    // Also return legacy week-grouped data for uploads that predate tracking
    const legacyWeeks = await prisma.counterReading.groupBy({
      by: ['year', 'weekNumber', 'granularity'],
      where: { mallId, uploadId: null },
      _sum: { visitors: true },
      _count: { counterLabel: true },
      _max: { uploadedAt: true },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    // Deduplicate legacy by year+week
    const seen = new Map<string, (typeof legacyWeeks)[0]>();
    const granOrder: Record<string, number> = { hourly: 3, daily: 2, weekly: 1 };
    for (const w of legacyWeeks) {
      const key = `${w.year}-${w.weekNumber}`;
      const existing = seen.get(key);
      if (!existing || (granOrder[w.granularity] ?? 0) > (granOrder[existing.granularity] ?? 0)) {
        seen.set(key, w);
      }
    }

    const result = [
      // Tracked uploads
      ...uploads.map((u) => ({
        id: u.id,
        year: u.year,
        week: u.weekNumber,
        granularity: u.granularity,
        totalVisitors: null as number | null,
        counterCount: u.counters,
        readingCount: u.readings,
        uploadedAt: u.uploadedAt,
        fileName: u.fileName,
        type: 'upload' as const,
      })),
      // Legacy untracked data
      ...[...seen.values()].map((w) => ({
        id: null as string | null,
        year: w.year,
        week: w.weekNumber,
        granularity: w.granularity,
        totalVisitors: w._sum.visitors ?? 0,
        counterCount: w._count.counterLabel,
        readingCount: null as number | null,
        uploadedAt: w._max.uploadedAt,
        fileName: null as string | null,
        type: 'legacy' as const,
      })),
    ];

    return NextResponse.json(result);
  } catch (err) {
    console.error('[counter weeks]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId') ?? 'ideapark-lempaala';
  const uploadId = searchParams.get('uploadId');
  const week = parseInt(searchParams.get('week') ?? '', 10);
  const year = parseInt(searchParams.get('year') ?? '', 10);

  try {
    if (uploadId) {
      // Delete a specific tracked upload and its readings
      const deleted = await prisma.counterReading.deleteMany({
        where: { uploadId },
      });
      await prisma.counterUpload.delete({ where: { id: uploadId } });
      return NextResponse.json({ ok: true, deleted: deleted.count, uploadId });
    }

    if (!week || !year) {
      return NextResponse.json({ error: 'Missing week/year or uploadId' }, { status: 400 });
    }

    // Legacy delete by week+year (untracked uploads only)
    const deleted = await prisma.counterReading.deleteMany({
      where: { mallId, weekNumber: week, year, uploadId: null },
    });

    return NextResponse.json({ ok: true, deleted: deleted.count, week, year });
  } catch (err) {
    console.error('[counter delete]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
