import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindAdminClient } from '@/lib/shoppermind-client';
import type { SourceType } from '@stelthion/shoppermind-client-types';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const country = new URL(req.url).searchParams.get('country');
  const configured = Boolean(getShopperMindAdminClient());
  return NextResponse.json({
    configured,
    country,
    sources: [],
    error: 'source_management_moved_to_shoppermind_service',
  });
}

interface CreatePayload {
  name: string;
  type: SourceType;
  url: string;
  country: string;
  language: string;
  weight?: number;
  active?: boolean;
  config?: Record<string, unknown> | null;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as CreatePayload;
  if (!body.name || !body.type || !body.url || !body.country || !body.language) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'source_management_moved_to_shoppermind_service' },
    { status: 501 },
  );
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as Partial<CreatePayload> & { id: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  return NextResponse.json(
    { error: 'source_management_moved_to_shoppermind_service' },
    { status: 501 },
  );
}
