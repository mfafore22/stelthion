import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import type { SourceType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const country = new URL(req.url).searchParams.get('country');
  const sources = await prisma.signalSource.findMany({
    where: country ? { country } : undefined,
    orderBy: [{ country: 'asc' }, { type: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(sources);
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

  const created = await prisma.signalSource.create({
    data: {
      name: body.name,
      type: body.type,
      url: body.url,
      country: body.country.toUpperCase(),
      language: body.language.toLowerCase(),
      weight: body.weight ?? 1.0,
      active: body.active ?? true,
      config: body.config ? JSON.parse(JSON.stringify(body.config)) : undefined,
    },
  });
  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as Partial<CreatePayload> & { id: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { id, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };
  if (rest.country) data.country = rest.country.toUpperCase();
  if (rest.language) data.language = rest.language.toLowerCase();

  const updated = await prisma.signalSource.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}
