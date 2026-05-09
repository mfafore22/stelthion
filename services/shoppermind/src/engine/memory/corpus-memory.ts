import type { CorpusDocument } from '../insights/phenomenon-corpus.js';

export interface MemoryDocumentProjection {
  id: string;
  domain: 'shoppermind';
  tier: 'retrieval';
  scope: { marketId: string };
  title: string;
  body: string;
  sourceIds: string[];
  entityIds: string[];
  freshnessAt: string;
  sensitivity: 'public';
  metadata: CorpusDocument['metadata'];
}

export function corpusToMemoryDocument(doc: CorpusDocument): MemoryDocumentProjection {
  return {
    id: doc.id,
    domain: 'shoppermind',
    tier: 'retrieval',
    scope: { marketId: doc.marketId },
    title: doc.title,
    body: doc.body,
    sourceIds: [],
    entityIds: [doc.phenomenonId],
    freshnessAt: doc.metadata.lastSignalAt,
    sensitivity: 'public',
    metadata: doc.metadata,
  };
}
