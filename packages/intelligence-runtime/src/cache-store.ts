import type { CacheEntry, CachePort } from './cache.js';

export class InMemoryCachePort implements CachePort {
  private entries = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (new Date(entry.expiresAt) <= new Date()) {
      this.entries.delete(key);
      return null;
    }
    return cloneEntry(entry) as CacheEntry<T>;
  }

  async set<T>(entry: CacheEntry<T>): Promise<void> {
    this.entries.set(entry.key, cloneEntry(entry));
  }

  async invalidateByTag(tag: string): Promise<number> {
    let deleted = 0;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.tags.includes(tag)) {
        this.entries.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}

function cloneEntry<T>(entry: CacheEntry<T>): CacheEntry<T> {
  return JSON.parse(JSON.stringify(entry)) as CacheEntry<T>;
}
