import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mallId = formData.get('mallId') as string | null;

    if (!file || !mallId) {
      return NextResponse.json({ error: 'Missing file or mallId' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Use "Counters as columns" sheet
    const sheetName =
      workbook.SheetNames.find((n) => n.toLowerCase().includes('counters as columns')) ??
      workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    if (rows.length < 5) {
      return NextResponse.json({ error: 'Sheet has too few rows' }, { status: 400 });
    }

    // --- Detect format: legacy weekly/daily vs ViaWeb monthly ("Vertical") ---
    // Detection is content-based only — never relies on filename.
    // ViaWeb monthly indicators:
    //   1. Sheet named "Vertical"
    //   2. Header row contains "ViaWeb" brand text
    //   3. Date range line like "1 February 2026 - 28 February 2026"
    //   4. Data rows use combined "Day, Mon D, HH:MM" format (date+time in one cell)
    const hasVerticalSheet = workbook.SheetNames.includes('Vertical');
    const hasViaWebHeader = rows.slice(0, 12).some((r) =>
      str(r[0]).match(/ViaWeb/i) ||
      str(r[0]).match(/^\d+\s+[A-Za-z]+\s+\d{4}\s*[-–]\s*\d+\s+[A-Za-z]+\s+\d{4}/)
    );
    const hasCombinedDateTimeRows = rows.slice(0, 30).some((r) =>
      str(r[0]).match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{1,2}:\d{2}$/i)
    );
    const isViaWebMonthly = hasVerticalSheet || hasViaWebHeader || hasCombinedDateTimeRows;

    if (isViaWebMonthly) {
      return await parseViaWebMonthly(rows, file.name, mallId, prisma);
    }

    // --- Legacy format: find counter header rows (week-based, "Counters as columns") ---
    let counterHeaderIdx = -1;
    let subHeaderIdx = -1;
    let reportDate: Date | null = null;

    for (let r = 0; r < Math.min(20, rows.length); r++) {
      const firstCell = str(rows[r][0]);

      // Extract report date from "Date: 2026-03-27"
      const dateMatch = firstCell.match(/^Date:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        reportDate = new Date(dateMatch[1] + 'T00:00:00');
      }

      // Find the sub-header row with "wk." or "vk." patterns
      const rowStr = rows[r].map(String).join(' ');
      if (rowStr.match(/(?:wk|vk)\.\d+\s+\d{4}/i) && subHeaderIdx === -1) {
        if (counterHeaderIdx === -1 && r > 0) {
          counterHeaderIdx = r - 1;
        }
        subHeaderIdx = r;
      }

      if (counterHeaderIdx === -1 && r < 5) {
        const cellCount = rows[r].filter((c) => c != null && str(c).trim().length > 3).length;
        if (cellCount >= 3) {
          const hasCounterName = rows[r].some(
            (c) => c != null && typeof c === 'string' && (c.includes('Sisäänkäynti') || c.includes('CityMarket') || c.includes('kerros') || c.includes('Huoltokäytävä')),
          );
          if (hasCounterName) {
            counterHeaderIdx = r;
          }
        }
      }
    }

    if (counterHeaderIdx >= 0 && subHeaderIdx === -1) {
      subHeaderIdx = counterHeaderIdx + 1;
    }

    if (counterHeaderIdx === -1) {
      return NextResponse.json({ error: 'Could not find counter header row' }, { status: 400 });
    }

    const headerRow = rows[counterHeaderIdx];
    const subHeader = rows[subHeaderIdx] ?? [];

    // --- Extract week and year from sub-header ---
    const subStr = subHeader.map(String).join(' ');
    const weekMatch = subStr.match(/(?:wk|vk)\.?\s*(\d+)\s+(\d{4})/i);
    let weekNumber = 0;
    let year = new Date().getFullYear();
    if (weekMatch) {
      weekNumber = parseInt(weekMatch[1], 10);
      year = parseInt(weekMatch[2], 10);
    }

    // --- Identify counter columns ---
    interface CounterCol {
      label: string;
      cleanLabel: string;
      floor: string;
      colCurrent: number;
      colPrev1: number;
      colPrev2: number;
      colPrev3: number;
    }

    const counters: CounterCol[] = [];
    for (let c = 1; c < headerRow.length; c++) {
      const val = headerRow[c];
      if (val == null) continue;
      const raw = str(val).trim();
      if (raw.length === 0 || raw === ' ') continue;
      if (raw.startsWith('∆') || raw.match(/^(?:wk|vk)\./i) || raw.match(/^\d{4}\*?$/) || raw.toLowerCase() === 'totals' || raw.toLowerCase() === 'total' || raw.toLowerCase() === 'date') continue;

      const label = raw;
      const cleanLabel = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const floor = label.toLowerCase().includes('2. kerros') ? 'upper' : 'ground';

      let colEnd = c + 1;
      for (let nc = c + 1; nc < headerRow.length; nc++) {
        const nextVal = headerRow[nc];
        if (nextVal != null && str(nextVal).trim().length > 0 && !str(nextVal).startsWith('∆') && !str(nextVal).match(/^(?:wk|vk)\./i) && !str(nextVal).match(/^\d{4}\*?$/)) {
          break;
        }
        colEnd = nc + 1;
      }

      let colPrev1 = -1;
      let colPrev2 = -1;
      let colPrev3 = -1;

      if (weekNumber > 0) {
        const yoyColumns: { col: number; yr: number }[] = [];
        for (let sc = c; sc < colEnd; sc++) {
          const sub = str(subHeader[sc]).trim();
          if (sub.startsWith('∆')) continue;
          const m = sub.match(/(?:wk|vk)\.?\s*(\d+)\s+(\d{4})/i);
          if (!m) continue;
          const subWk = parseInt(m[1], 10);
          const subYr = parseInt(m[2], 10);
          if (sc === c) continue;
          if (subWk === weekNumber && subYr !== year) {
            yoyColumns.push({ col: sc, yr: subYr });
          }
        }
        yoyColumns.sort((a, b) => b.yr - a.yr);
        if (yoyColumns.length >= 1) colPrev1 = yoyColumns[0].col;
        if (yoyColumns.length >= 2) colPrev2 = yoyColumns[1].col;
        if (yoyColumns.length >= 3) colPrev3 = yoyColumns[2].col;
      }

      if (colPrev1 === -1 && colEnd - c >= 2) {
        colPrev1 = c + 1;
      }

      counters.push({ label, cleanLabel, floor, colCurrent: c, colPrev1, colPrev2, colPrev3 });
    }

    if (counters.length === 0) {
      return NextResponse.json({ error: 'No counter columns found in header' }, { status: 400 });
    }

    function resolveLabel(counter: CounterCol): string {
      return counter.cleanLabel || counter.label;
    }

    const dataRowStart = subHeaderIdx + 1;
    const warnings: string[] = [];

    interface Reading {
      counterLabel: string;
      floor: string;
      date: Date;
      hour: number;
      visitors: number;
      visitorsPrevYear: number | null;
      visitorsYear2: number | null;
      visitorsYear3: number | null;
      granularity: string;
    }
    const readings: Reading[] = [];

    const hourRows: { rowIdx: number; hour: number }[] = [];
    const dateRows: { rowIdx: number; date: Date }[] = [];

    for (let r = dataRowStart; r < rows.length; r++) {
      const firstCell = str(rows[r][0]).trim();
      if (firstCell === '' || firstCell === ' ') continue;
      if (firstCell.toLowerCase().includes('total') || firstCell.toLowerCase().includes('yhteensä')) continue;
      if (firstCell.startsWith('∆') || firstCell.match(/^(?:wk|vk)\./i) || firstCell.match(/^\d{4}\*?$/)) continue;
      if (firstCell.match(/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)) continue;

      const hourMatch = firstCell.match(/^(\d{1,2}):00$/);
      if (hourMatch) {
        hourRows.push({ rowIdx: r, hour: parseInt(hourMatch[1], 10) });
        continue;
      }

      const parsed = parseFlexDate(firstCell, year);
      if (parsed) {
        dateRows.push({ rowIdx: r, date: parsed });
      }
    }

    let detectedGranularity: 'hourly' | 'daily' | 'weekly';
    if (hourRows.length >= 10) {
      detectedGranularity = 'hourly';
    } else if (dateRows.length >= 1) {
      detectedGranularity = 'daily';
    } else {
      detectedGranularity = 'weekly';
    }

    if (detectedGranularity === 'hourly') {
      const date = reportDate ?? getMonday(year, weekNumber);
      for (const { rowIdx, hour } of hourRows) {
        const row = rows[rowIdx];
        for (const counter of counters) {
          const label = resolveLabel(counter);
          const visitors = parseNum(row[counter.colCurrent]);
          const prev1 = counter.colPrev1 >= 0 ? parseNum(row[counter.colPrev1]) : null;
          const prev2 = counter.colPrev2 >= 0 ? parseNum(row[counter.colPrev2]) : null;
          const prev3 = counter.colPrev3 >= 0 ? parseNum(row[counter.colPrev3]) : null;
          if (visitors === 0 && !prev1 && !prev2 && !prev3) continue;
          readings.push({ counterLabel: label, floor: counter.floor, date, hour, visitors, visitorsPrevYear: prev1, visitorsYear2: prev2, visitorsYear3: prev3, granularity: 'hourly' });
        }
      }
    } else if (detectedGranularity === 'daily') {
      for (const { rowIdx, date } of dateRows) {
        const row = rows[rowIdx];
        for (const counter of counters) {
          const label = resolveLabel(counter);
          const visitors = parseNum(row[counter.colCurrent]);
          const prev1 = counter.colPrev1 >= 0 ? parseNum(row[counter.colPrev1]) : null;
          const prev2 = counter.colPrev2 >= 0 ? parseNum(row[counter.colPrev2]) : null;
          const prev3 = counter.colPrev3 >= 0 ? parseNum(row[counter.colPrev3]) : null;
          readings.push({ counterLabel: label, floor: counter.floor, date, hour: -1, visitors, visitorsPrevYear: prev1, visitorsYear2: prev2, visitorsYear3: prev3, granularity: 'daily' });
        }
      }
    } else {
      const monday = getMonday(year, weekNumber);
      for (const counter of counters) {
        const label = resolveLabel(counter);
        let totalVisitors = 0;
        let totalPrev: number | null = null;
        let totalYear2: number | null = null;
        let totalYear3: number | null = null;

        if (dateRows.length > 0) {
          for (const { rowIdx } of dateRows) {
            totalVisitors += parseNum(rows[rowIdx][counter.colCurrent]);
            const pv = parseNum(rows[rowIdx][counter.colPrev1 >= 0 ? counter.colPrev1 : -1]);
            if (pv > 0) totalPrev = (totalPrev ?? 0) + pv;
            const pv2 = counter.colPrev2 >= 0 ? parseNum(rows[rowIdx][counter.colPrev2]) : 0;
            if (pv2 > 0) totalYear2 = (totalYear2 ?? 0) + pv2;
            const pv3 = counter.colPrev3 >= 0 ? parseNum(rows[rowIdx][counter.colPrev3]) : 0;
            if (pv3 > 0) totalYear3 = (totalYear3 ?? 0) + pv3;
          }
        } else {
          for (let r = dataRowStart; r < rows.length; r++) {
            const v = parseNum(rows[r][counter.colCurrent]);
            if (v > 0) {
              totalVisitors = v;
              totalPrev = counter.colPrev1 >= 0 ? parseNum(rows[r][counter.colPrev1]) || null : null;
              totalYear2 = counter.colPrev2 >= 0 ? parseNum(rows[r][counter.colPrev2]) || null : null;
              totalYear3 = counter.colPrev3 >= 0 ? parseNum(rows[r][counter.colPrev3]) || null : null;
              break;
            }
          }
        }

        if (totalVisitors > 0) {
          readings.push({ counterLabel: label, floor: counter.floor, date: monday, hour: -1, visitors: totalVisitors, visitorsPrevYear: totalPrev, visitorsYear2: totalYear2, visitorsYear3: totalYear3, granularity: 'weekly' });
        }
      }
    }

    if (readings.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid readings found', warnings }, { status: 400 });
    }

    const counterLabels = [...new Set(readings.map((r) => r.counterLabel))];
    const fullLabels = [...new Set(counters.map((c) => c.label))];
    const allLabels = [...new Set([...counterLabels, ...fullLabels])];

    await prisma.counterReading.deleteMany({
      where: { mallId, weekNumber, year, counterLabel: { in: allLabels } },
    });

    const upload = await prisma.counterUpload.create({
      data: {
        mallId,
        fileName: file.name,
        weekNumber,
        year,
        granularity: detectedGranularity,
        counters: [...new Set(readings.map((r) => r.counterLabel))].length,
        readings: readings.length,
      },
    });

    for (const r of readings) {
      await prisma.counterReading.upsert({
        where: { mallId_counterLabel_date_hour: { mallId, counterLabel: r.counterLabel, date: r.date, hour: r.hour } },
        update: { visitors: r.visitors, visitorsPrevYear: r.visitorsPrevYear, visitorsYear2: r.visitorsYear2, visitorsYear3: r.visitorsYear3, granularity: r.granularity, uploadedAt: new Date(), uploadId: upload.id },
        create: { mallId, counterLabel: r.counterLabel, floor: r.floor, date: r.date, hour: r.hour, weekNumber, year, visitors: r.visitors, visitorsPrevYear: r.visitorsPrevYear, visitorsYear2: r.visitorsYear2, visitorsYear3: r.visitorsYear3, granularity: r.granularity, uploadId: upload.id },
      });
    }

    return NextResponse.json({
      ok: true,
      imported: readings.length,
      week: weekNumber,
      year,
      granularity: detectedGranularity,
      countersFound: upload.counters,
      date: reportDate?.toISOString().split('T')[0] ?? null,
      uploadId: upload.id,
      warnings,
    });
  } catch (err) {
    console.error('[counter upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// --- Helpers ---

function str(val: unknown): string {
  if (val == null) return '';
  return String(val);
}

function parseNum(val: unknown): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

function parseFlexDate(s: string, fallbackYear: number): Date | null {
  const trimmed = s.trim();

  // "Day, Mon DD" (e.g. "Fri, Mar 27")
  const dayMonDD = trimmed.match(
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i,
  );
  if (dayMonDD) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const m = months[dayMonDD[1].toLowerCase()];
    const d = parseInt(dayMonDD[2], 10);
    if (m !== undefined) return new Date(fallbackYear, m, d);
  }

  // DD.MM.YYYY or DD.MM
  const dotFormat = trimmed.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (dotFormat) {
    const d = parseInt(dotFormat[1], 10);
    const m = parseInt(dotFormat[2], 10) - 1;
    const y = dotFormat[3] ? parseInt(dotFormat[3], 10) : fallbackYear;
    return new Date(y, m, d);
  }

  // ISO format
  const isoDate = Date.parse(trimmed);
  if (!isNaN(isoDate)) return new Date(isoDate);

  return null;
}

function getMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

// --- ViaWeb "Vertical" monthly export parser ---
// Format: sheet named "Vertical", rows 7-8 = title/date range, row 15 = counter headers,
// rows 16+ = "Day, Mon D, HH:MM" hourly data, final row = "Total" summary.
async function parseViaWebMonthly(
  rows: (string | number | null)[][],
  fileName: string,
  mallId: string,
  db: typeof prisma,
): Promise<NextResponse> {
  const warnings: string[] = [];

  // --- Extract date range from header (row 8: "1 February 2026 - 28 February 2026") ---
  let fileYear = new Date().getFullYear();
  for (let r = 0; r < Math.min(12, rows.length); r++) {
    const cell = str(rows[r][0]);
    const rangeMatch = cell.match(/(\d+)\s+\w+\s+(\d{4})\s*[-–]\s*\d+\s+\w+\s+(\d{4})/);
    if (rangeMatch) {
      fileYear = parseInt(rangeMatch[2], 10);
      break;
    }
  }

  // --- Find counter header row (contains counter names with "(Asiakasovet)" suffix) ---
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(20, rows.length); r++) {
    const hasCounterName = rows[r].some(
      (c) => c != null && typeof c === 'string' &&
        (c.includes('Sisäänkäynti') || c.includes('CityMarket') || c.includes('kerros') || c.includes('Asiakasovet')),
    );
    if (hasCounterName) {
      headerRowIdx = r;
      break;
    }
  }
  if (headerRowIdx === -1) {
    return NextResponse.json({ error: 'ViaWeb: could not find counter header row' }, { status: 400 });
  }

  const headerRow = rows[headerRowIdx];

  // --- Build counter list: skip col 0 (date/time), skip "Total" column ---
  interface ViaCounter { label: string; cleanLabel: string; floor: string; col: number; }
  const counters: ViaCounter[] = [];
  for (let c = 1; c < headerRow.length; c++) {
    const raw = str(headerRow[c]).trim();
    if (!raw || raw.toLowerCase() === 'total') continue;
    const cleanLabel = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const floor = raw.toLowerCase().includes('2. kerros') ? 'upper' : 'ground';
    counters.push({ label: raw, cleanLabel, floor, col: c });
  }
  if (counters.length === 0) {
    return NextResponse.json({ error: 'ViaWeb: no counters found in header' }, { status: 400 });
  }

  // --- Parse data rows: "Day, Mon D, HH:MM" ---
  // e.g. "Sun, Feb 1, 00:00"  →  date=2026-02-01, hour=0
  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  interface Reading {
    counterLabel: string; floor: string; date: Date; hour: number;
    visitors: number; visitorsPrevYear: null; visitorsYear2: null; visitorsYear3: null;
    granularity: string; weekNumber: number; year: number;
  }
  const readings: Reading[] = [];

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const cell = str(rows[r][0]).trim();
    if (!cell) continue;
    if (cell.toLowerCase().startsWith('total')) continue;

    // Match "Day, Mon D, HH:MM"  (day number can be 1 or 2 digits)
    const m = cell.match(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})$/i,
    );
    if (!m) continue;

    const monthIdx = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    const hour = parseInt(m[3], 10);
    if (monthIdx === undefined) continue;

    const date = new Date(fileYear, monthIdx, day);
    const { week: weekNumber, year } = getISOWeek(date);

    for (const counter of counters) {
      const visitors = parseNum(rows[r][counter.col]);
      if (visitors === 0) continue;
      readings.push({
        counterLabel: counter.cleanLabel,
        floor: counter.floor,
        date,
        hour,
        visitors,
        visitorsPrevYear: null,
        visitorsYear2: null,
        visitorsYear3: null,
        granularity: 'hourly',
        weekNumber,
        year,
      });
    }
  }

  if (readings.length === 0) {
    return NextResponse.json({ ok: false, error: 'ViaWeb: no valid readings found', warnings }, { status: 400 });
  }

  // --- Delete existing readings for affected counter+date+hour combinations ---
  const affectedLabels = [...new Set(readings.map((r) => r.counterLabel))];
  const minDate = readings.reduce((min, r) => r.date < min ? r.date : min, readings[0].date);
  const maxDate = readings.reduce((max, r) => r.date > max ? r.date : max, readings[0].date);

  await db.counterReading.deleteMany({
    where: {
      mallId,
      counterLabel: { in: affectedLabels },
      date: { gte: minDate, lte: maxDate },
    },
  });

  // --- Create upload record (weekNumber=0 signals monthly upload) ---
  const upload = await db.counterUpload.create({
    data: {
      mallId,
      fileName,
      weekNumber: 0,
      year: fileYear,
      granularity: 'hourly',
      counters: affectedLabels.length,
      readings: readings.length,
    },
  });

  // --- Upsert all readings ---
  for (const r of readings) {
    await db.counterReading.upsert({
      where: { mallId_counterLabel_date_hour: { mallId, counterLabel: r.counterLabel, date: r.date, hour: r.hour } },
      update: { visitors: r.visitors, visitorsPrevYear: null, visitorsYear2: null, visitorsYear3: null, granularity: 'hourly', uploadedAt: new Date(), uploadId: upload.id },
      create: { mallId, counterLabel: r.counterLabel, floor: r.floor, date: r.date, hour: r.hour, weekNumber: r.weekNumber, year: r.year, visitors: r.visitors, visitorsPrevYear: null, visitorsYear2: null, visitorsYear3: null, granularity: 'hourly', uploadId: upload.id },
    });
  }

  const weeksImported = [...new Set(readings.map((r) => `${r.year}-W${r.weekNumber}`))].sort();

  return NextResponse.json({
    ok: true,
    format: 'viaweb-monthly',
    imported: readings.length,
    countersFound: affectedLabels.length,
    year: fileYear,
    weeksImported,
    dateRange: { from: minDate.toISOString().slice(0, 10), to: maxDate.toISOString().slice(0, 10) },
    uploadId: upload.id,
    warnings,
  });
}
