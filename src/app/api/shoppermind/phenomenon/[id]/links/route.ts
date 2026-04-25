import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getShopperMindAdminClient } from '@/lib/shoppermind-client';
import type { LinkType } from '@stelthion/shoppermind-client-types';

const VALID_LINK_TYPES: LinkType[] = [
  'CONTRIBUTES_TO',
  'MANIFESTATION_OF',
  'ACCELERATES',
  'PRECEDES',
  'CONTRADICTS',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await params;
  const client = getShopperMindAdminClient();
  if (!client) {
    return NextResponse.json(
      { error: 'ShopperMind service not configured' },
      { status: 503 },
    );
  }

  let body: {
    toPhenomenonId?: string;
    linkType?: string;
    weight?: number;
    rationale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.toPhenomenonId || typeof body.toPhenomenonId !== 'string') {
    return NextResponse.json({ error: 'toPhenomenonId required' }, { status: 400 });
  }
  if (!body.linkType || !VALID_LINK_TYPES.includes(body.linkType as LinkType)) {
    return NextResponse.json({ error: 'invalid linkType' }, { status: 400 });
  }
  if (body.weight !== undefined && (body.weight < 0 || body.weight > 1)) {
    return NextResponse.json({ error: 'weight must be 0..1' }, { status: 400 });
  }

  try {
    const link = await client.createPhenomenonLink(id, {
      toPhenomenonId: body.toPhenomenonId,
      linkType: body.linkType as LinkType,
      weight: body.weight,
      rationale: body.rationale,
      inferredBy: 'human',
    });
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'service error' },
      { status: 502 },
    );
  }
}
