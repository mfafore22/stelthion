import {
  ShopperMindClient,
  ShopperMindInternalClient,
} from '@stelthion/shoppermind-client';
import prisma from '@/app/lib/prisma';

// Server-only factory. Returns null when the service env vars aren't
// configured so callers (concierge tools, future mall admin UI) can
// gracefully degrade - the legacy behaviour used runtime model probing
// for the same reason, this keeps that contract.
let cached: ShopperMindClient | null | undefined;
let cachedAdmin: ShopperMindClient | null | undefined;
let cachedInternal: ShopperMindInternalClient | null | undefined;

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

// Admin-scoped factory - uses the internal token which unlocks PUT /markets
// and POST /phenomena/:id/links. Callers MUST gate with requireAdmin first.
export function getShopperMindAdminClient(): ShopperMindClient | null {
  if (cachedAdmin !== undefined) return cachedAdmin;
  const baseUrl = process.env.SHOPPERMIND_SERVICE_URL;
  const token = process.env.SHOPPERMIND_INTERNAL_TOKEN;
  if (!baseUrl || !token) {
    cachedAdmin = null;
    return null;
  }
  cachedAdmin = new ShopperMindClient({ baseUrl, token });
  return cachedAdmin;
}

export function getShopperMindInternalClient(): ShopperMindInternalClient | null {
  if (cachedInternal !== undefined) return cachedInternal;
  const baseUrl = process.env.SHOPPERMIND_SERVICE_URL;
  const token = process.env.SHOPPERMIND_INTERNAL_TOKEN;
  if (!baseUrl || !token) {
    cachedInternal = null;
    return null;
  }
  cachedInternal = new ShopperMindInternalClient({ baseUrl, token });
  return cachedInternal;
}

export function resolveMarketIdFromCountry(country?: string | null): string {
  switch (country?.toUpperCase()) {
    case 'AE':
      return 'dubai-ae';
    case 'DE':
      return 'berlin-de';
    case 'SE':
      return 'stockholm-se';
    case 'UK':
    case 'GB':
      return 'london-uk';
    case 'US':
      return 'newyork-us';
    case 'FI':
    default:
      return 'helsinki-fi';
  }
}

// Resolves mallId to ShopperMind marketId via MallMarketMapping table.
// Falls back to a heuristic for unmapped malls so existing behaviour is preserved.
export async function resolveMarketIdFromMall(mallId: string): Promise<string> {
  try {
    const row = await prisma.mallMarketMapping.findUnique({ where: { mallId } });
    if (row) return row.marketId;
  } catch {
    // DB unavailable — fall through to heuristic
  }
  const lower = mallId.toLowerCase();
  if (lower.includes('dubai') || lower.includes('abu') || lower.includes('uae')) return 'dubai-ae';
  return 'helsinki-fi';
}
