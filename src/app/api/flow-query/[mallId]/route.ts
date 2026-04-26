/**
 * POST /api/flow-query/[mallId]
 * Returns visitor flow data for zone-to-zone analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFlowQueryResponse } from '@/lib/data/flowQueryDemo';
import type { FlowDirection } from '@/lib/types/flowQuery';
import { auth } from '@/auth';
import { isMallId } from '@/lib/mall/ids';

const VALID_DIRECTIONS: FlowDirection[] = ['outbound', 'inbound', 'between'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mallId } = await params;

  if (!isMallId(mallId, 'ideapark-lempaala')) {
    return NextResponse.json(
      { error: 'Flow query is only available for Ideapark Lempäälä' },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { origin, direction, destination, hour, dayOfWeek, date, startTime } = body as {
    origin?: string;
    direction?: string;
    destination?: string;
    hour?: number;
    dayOfWeek?: number;
    date?: string;
    startTime?: string;
  };

  if (!origin || typeof origin !== 'string') {
    return NextResponse.json({ error: 'origin is required' }, { status: 400 });
  }

  if (!direction || !VALID_DIRECTIONS.includes(direction as FlowDirection)) {
    return NextResponse.json(
      { error: `direction must be one of: ${VALID_DIRECTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  if (direction === 'between' && (!destination || typeof destination !== 'string')) {
    return NextResponse.json(
      { error: 'destination is required for between queries' },
      { status: 400 }
    );
  }

  // Derive hour from startTime if provided, otherwise use hour param or current time
  let h: number;
  if (startTime && typeof startTime === 'string') {
    h = parseInt(startTime.split(':')[0], 10);
    if (isNaN(h) || h < 8 || h > 21) h = new Date().getHours();
  } else {
    h = typeof hour === 'number' && hour >= 10 && hour <= 21 ? hour : new Date().getHours();
  }

  // Derive dayOfWeek from date if provided, otherwise use dayOfWeek param or current day
  let dow: number;
  if (date && typeof date === 'string') {
    dow = new Date(date).getDay();
    if (isNaN(dow)) dow = new Date().getDay();
  } else {
    dow = typeof dayOfWeek === 'number' && dayOfWeek >= 0 && dayOfWeek <= 6
      ? dayOfWeek
      : new Date().getDay();
  }

  const result = generateFlowQueryResponse(
    origin,
    direction as FlowDirection,
    h,
    dow,
    destination
  );

  if (!result) {
    return NextResponse.json({ error: 'Origin zone not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}
