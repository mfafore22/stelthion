'use client';

import { useCallback } from 'react';

export interface ShopperMindActivityPayload {
  eventName: string;
  mallId?: string | null;
  marketId?: string | null;
  tab?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  categoryIds?: string[];
  metadata?: Record<string, unknown>;
}

export function useShopperMindActivity(defaults: { mallId?: string | null; marketId?: string | null }) {
  return useCallback((payload: ShopperMindActivityPayload) => {
    const mallId = payload.mallId ?? defaults.mallId;
    if (!mallId) return;
    fetch('/api/shoppermind/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({
        ...payload,
        mallId,
        marketId: payload.marketId ?? defaults.marketId,
      }),
    }).catch(() => undefined);
  }, [defaults.mallId, defaults.marketId]);
}
