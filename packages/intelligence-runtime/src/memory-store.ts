import type { MemoryDocument, MemoryPort, MemoryQuery } from './memory.js';

export class InMemoryMemoryPort implements MemoryPort {
  private documents = new Map<string, MemoryDocument>();

  async upsert(document: MemoryDocument): Promise<void> {
    this.documents.set(document.id, cloneDocument(document));
  }

  async search(query: MemoryQuery): Promise<MemoryDocument[]> {
    const docs = Array.from(this.documents.values())
      .filter((document) => matches(document, query))
      .slice(0, query.limit ?? Number.POSITIVE_INFINITY);
    return docs.map(cloneDocument);
  }

  async deleteExpired(now: Date): Promise<number> {
    let deleted = 0;
    for (const [id, document] of this.documents.entries()) {
      if (document.expiresAt && new Date(document.expiresAt) <= now) {
        this.documents.delete(id);
        deleted++;
      }
    }
    return deleted;
  }
}

function matches(document: MemoryDocument, query: MemoryQuery): boolean {
  if (document.domain !== query.domain) return false;
  if (query.tier && document.tier !== query.tier) return false;
  if (!scopeContains(document.scope.customerId, query.scope.customerId)) return false;
  if (!scopeContains(document.scope.marketId, query.scope.marketId)) return false;
  if (!scopeContains(document.scope.propertyId, query.scope.propertyId)) return false;
  if (!scopeContains(document.scope.venueId, query.scope.venueId)) return false;
  if (query.query && !textMatches(document, query.query)) return false;
  return true;
}

function scopeContains(value: string | undefined, wanted: string | undefined): boolean {
  return !wanted || value === wanted;
}

function textMatches(document: MemoryDocument, query: string): boolean {
  const haystack = `${document.title} ${document.body}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((part) => haystack.includes(part));
}

function cloneDocument(document: MemoryDocument): MemoryDocument {
  return JSON.parse(JSON.stringify(document)) as MemoryDocument;
}
