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

    // --- Find the actual header rows (skip spacer rows) ---
    // Look for the row containing counter names and the row with "wk." sub-headers
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
        // Check if previous row has counter names
        if (counterHeaderIdx === -1 && r > 0) {
          counterHeaderIdx = r - 1;
        }
        subHeaderIdx = r;
      }

      // Also detect old format: counter names directly in first row with "wk." pattern
      if (counterHeaderIdx === -1 && r < 5) {
        const cellCount = rows[r].filter((c) => c != null && str(c).trim().length > 3).length;
        if (cellCount >= 3) {
          // Could be counter header row if cells look like counter names (not spacers)
          const hasCounterName = rows[r].some(
            (c) => c != null && typeof c === 'string' && (c.includes('Sisäänkäynti') || c.includes('CityMarket') || c.includes('kerros') || c.includes('Huoltokäytävä')),
          );
          if (hasCounterName) {
            counterHeaderIdx = r;
          }
        }
      }
    }

    // If no sub-header found, look for it based on counter header
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
    // Detect column grouping: 3 cols (current, prev, delta) or 7 cols (current, prev1, d1, prev2, d2, prev3, d3)
    interface CounterCol {
      label: string;
      cleanLabel: string; // without group suffix like "(Asiakasovet)"
      floor: string;
      colCurrent: number;
      colPrev1: number;
      colPrev2: number; // -1 if not available
      colPrev3: number; // -1 if not available
    }

    const counters: CounterCol[] = [];
    for (let c = 1; c < headerRow.length; c++) {
      const val = headerRow[c];
      if (val == null) continue;
      const raw = str(val).trim();
      if (raw.length === 0 || raw === ' ') continue;
      // Skip delta columns, year reference columns, "Totals"
      if (raw.startsWith('∆') || raw.match(/^(?:wk|vk)\./i) || raw.match(/^\d{4}\*?$/) || raw.toLowerCase() === 'totals' || raw.toLowerCase() === 'date') continue;

      const label = raw;
      // Remove group suffix like "(Asiakasovet)", "(Koko Ideapark)", "(2. kerroksen laskurit)"
      const cleanLabel = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const floor = label.toLowerCase().includes('2. kerros') ? 'upper' : 'ground';

      // Find the column range for this counter (until next counter name)
      let colEnd = c + 1;
      for (let nc = c + 1; nc < headerRow.length; nc++) {
        const nextVal = headerRow[nc];
        if (nextVal != null && str(nextVal).trim().length > 0 && !str(nextVal).startsWith('∆') && !str(nextVal).match(/^(?:wk|vk)\./i) && !str(nextVal).match(/^\d{4}\*?$/)) {
          break; // next counter starts
        }
        colEnd = nc + 1;
      }

      // Scan sub-header columns to find year-over-year comparison columns
      // Look for "wk.{sameWeek} {differentYear}" entries (YoY), skip "wk.{differentWeek} {sameYear}" (WoW)
      let colPrev1 = -1;
      let colPrev2 = -1;
      let colPrev3 = -1;

      if (weekNumber > 0) {
        const yoyColumns: { col: number; yr: number }[] = [];
        for (let sc = c; sc < colEnd; sc++) {
          const sub = str(subHeader[sc]).trim();
          if (sub.startsWith('∆')) continue; // skip delta columns
          const m = sub.match(/(?:wk|vk)\.?\s*(\d+)\s+(\d{4})/i);
          if (!m) continue;
          const subWk = parseInt(m[1], 10);
          const subYr = parseInt(m[2], 10);
          if (sc === c) continue; // skip the current-week column itself
          // Same week number but different year = year-over-year comparison
          if (subWk === weekNumber && subYr !== year) {
            yoyColumns.push({ col: sc, yr: subYr });
          }
        }
        // Sort by year descending (most recent comparison year first)
        yoyColumns.sort((a, b) => b.yr - a.yr);
        if (yoyColumns.length >= 1) colPrev1 = yoyColumns[0].col;
        if (yoyColumns.length >= 2) colPrev2 = yoyColumns[1].col;
        if (yoyColumns.length >= 3) colPrev3 = yoyColumns[2].col;
      }

      // Fallback for simple 3-column format (no sub-header week info)
      if (colPrev1 === -1 && colEnd - c >= 2) {
        colPrev1 = c + 1;
      }

      counters.push({
        label,
        cleanLabel,
        floor,
        colCurrent: c,
        colPrev1,
        colPrev2,
        colPrev3,
      });
    }

    if (counters.length === 0) {
      return NextResponse.json({ error: 'No counter columns found in header' }, { status: 400 });
    }

    // Build label resolver: use cleaned label as canonical name for the counter
    function resolveLabel(counter: CounterCol): string {
      return counter.cleanLabel || counter.label;
    }

    // --- Detect granularity from data rows ---
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

    // Check first few data cells to detect hourly vs daily vs weekly
    const hourRows: { rowIdx: number; hour: number }[] = [];
    const dateRows: { rowIdx: number; date: Date }[] = [];

    for (let r = dataRowStart; r < rows.length; r++) {
      const firstCell = str(rows[r][0]).trim();
      if (firstCell === '' || firstCell === ' ') continue;
      if (firstCell.toLowerCase().includes('total') || firstCell.toLowerCase().includes('yhteensä')) continue;
      if (firstCell.startsWith('∆') || firstCell.match(/^(?:wk|vk)\./i) || firstCell.match(/^\d{4}\*?$/)) continue;
      if (firstCell.match(/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)) continue; // summary range like "00:00 - 00:00"

      // Try hour format: "HH:00" or "HH:MM"
      const hourMatch = firstCell.match(/^(\d{1,2}):00$/);
      if (hourMatch) {
        hourRows.push({ rowIdx: r, hour: parseInt(hourMatch[1], 10) });
        continue;
      }

      // Try date format
      const parsed = parseFlexDate(firstCell, year);
      if (parsed) {
        dateRows.push({ rowIdx: r, date: parsed });
      }
    }

    let detectedGranularity: 'hourly' | 'daily' | 'weekly';
    if (hourRows.length >= 10) {
      detectedGranularity = 'hourly';
    } else if (dateRows.length >= 1) {
      // Any date rows = daily (even 1 day of a partial week)
      detectedGranularity = 'daily';
    } else {
      detectedGranularity = 'weekly';
    }

    // --- Parse based on granularity ---

    if (detectedGranularity === 'hourly') {
      // Hourly: each row is an hour, date comes from report metadata
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
          readings.push({
            counterLabel: label,
            floor: counter.floor,
            date,
            hour,
            visitors,
            visitorsPrevYear: prev1,
            visitorsYear2: prev2,
            visitorsYear3: prev3,
            granularity: 'hourly',
          });
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
          readings.push({
            counterLabel: label,
            floor: counter.floor,
            date,
            hour: -1,
            visitors,
            visitorsPrevYear: prev1,
            visitorsYear2: prev2,
            visitorsYear3: prev3,
            granularity: 'daily',
          });
        }
      }
    } else {
      // Weekly totals
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
          readings.push({
            counterLabel: label,
            floor: counter.floor,
            date: monday,
            hour: -1,
            visitors: totalVisitors,
            visitorsPrevYear: totalPrev,
            visitorsYear2: totalYear2,
            visitorsYear3: totalYear3,
            granularity: 'weekly',
          });
        }
      }
    }

    if (readings.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid readings found', warnings },
        { status: 400 },
      );
    }

    // --- Clean up stale data for the same counters in this week ---
    // Delete existing readings that match these counter labels (including old
    // label variants with group suffixes) so re-uploads don't create duplicates.
    const counterLabels = [...new Set(readings.map((r) => r.counterLabel))];
    // Also collect full labels (with suffix) to clean up old-format entries
    const fullLabels = [...new Set(counters.map((c) => c.label))];
    const allLabels = [...new Set([...counterLabels, ...fullLabels])];

    await prisma.counterReading.deleteMany({
      where: {
        mallId,
        weekNumber,
        year,
        counterLabel: { in: allLabels },
      },
    });

    // --- Create upload record ---
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

    // --- Upsert readings ---
    for (const r of readings) {
      await prisma.counterReading.upsert({
        where: {
          mallId_counterLabel_date_hour: {
            mallId,
            counterLabel: r.counterLabel,
            date: r.date,
            hour: r.hour,
          },
        },
        update: {
          visitors: r.visitors,
          visitorsPrevYear: r.visitorsPrevYear,
          visitorsYear2: r.visitorsYear2,
          visitorsYear3: r.visitorsYear3,
          granularity: r.granularity,
          uploadedAt: new Date(),
          uploadId: upload.id,
        },
        create: {
          mallId,
          counterLabel: r.counterLabel,
          floor: r.floor,
          date: r.date,
          hour: r.hour,
          weekNumber,
          year,
          visitors: r.visitors,
          visitorsPrevYear: r.visitorsPrevYear,
          visitorsYear2: r.visitorsYear2,
          visitorsYear3: r.visitorsYear3,
          granularity: r.granularity,
          uploadId: upload.id,
        },
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
