import { ShopperMindClient } from '@stelthion/shoppermind-client';

// Server-only factory. Returns null when the service env vars aren't
// configured so callers (concierge tools, future mall admin UI) can
// gracefully degrade — the legacy behaviour used runtime model probing
// for the same reason, this keeps that contract.
let cached: ShopperMindClient | null | undefined;

export function getShopperMindClient(): ShopperMindClient | null {
  if (cached !== undefined) return cached;
  const baseUrl = process.env.SHOPPERMIND_SERVICE_URL;
  const token = process.env.SHOPPERMIND_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    cached = null;
    return null;
  }
  cached = new ShopperMindClient({ baseUrl, token });
  return cached;
}

// Phase 1 mapping: mallId → marketId. Phase 2 replaces this with a DB lookup
// (Mall.marketId column) so new markets don't need code changes here.
export function resolveMarketIdFromMall(mallId: string): string {
  const lower = mallId.toLowerCase();
  if (lower.includes('dubai') || lower.includes('abu') || lower.includes('uae')) return 'dubai-ae';
  return 'helsinki-fi';
}
