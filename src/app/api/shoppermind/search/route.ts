import { defineHandler, HttpError } from '@/server/api/define-handler';
import prisma from '@/server/db/client';
import { getEmbeddingClient } from '@/services/shoppermind/embedding';
import { cosineSimilarity } from '@/lib/stats';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req }) => {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const country = url.searchParams.get('country');
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 10));

    if (!query) throw new HttpError(400, 'q parameter required');

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

    return scored;
  },
);
