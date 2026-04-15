import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getEmbeddingClient } from '@/services/concierge/llm-client';
import { cosineSimilarity } from '@/lib/stats';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const country = url.searchParams.get('country');
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 10));

  if (!query) return NextResponse.json({ error: 'q parameter required' }, { status: 400 });

  const embedder = getEmbeddingClient();
  const [queryVec] = await embedder.embed([query]);

  const phenomena = await prisma.phenomenon.findMany({
    where: {
      mergedInto: null,
      ...(country ? { primaryCountry: country } : {}),
    },
    select: { id: true, label: true, description: true, primaryCountry: true, state: true, centroid: true, categories: true },
  });

  const scored = phenomena
    .filter((p) => p.centroid.length > 0)
    .map((p) => ({ ...p, similarity: cosineSimilarity(queryVec, p.centroid) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return NextResponse.json(scored);
}
