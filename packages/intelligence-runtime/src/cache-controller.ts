import {
  buildCacheKey,
  cacheTags,
  type CacheAddress,
  type CacheEntry,
  type CachePort,
} from './cache.js';

export interface CacheWriteOptions {
  ttlMs: number;
  now?: Date;
}

export class CacheController {
  constructor(private port: CachePort) {}

  async get<T>(address: CacheAddress): Promise<T | null> {
    const entry = await this.port.get<T>(buildCacheKey(address));
    return entry?.value ?? null;
  }

  async set<T>(
    address: CacheAddress,
    value: T,
    options: CacheWriteOptions,
  ): Promise<CacheEntry<T>> {
    const now = options.now ?? new Date();
    const entry: CacheEntry<T> = {
      key: buildCacheKey(address),
      value,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + options.ttlMs).toISOString(),
      tags: cacheTags(address),
    };
    await this.port.set(entry);
    return entry;
  }

  async getOrSet<T>(
    address: CacheAddress,
    options: CacheWriteOptions,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(address);
    if (cached !== null) return cached;
    const value = await load();
    await this.set(address, value, options);
    return value;
  }

  invalidateByTag(tag: string): Promise<number> {
    return this.port.invalidateByTag(tag);
  }
}
