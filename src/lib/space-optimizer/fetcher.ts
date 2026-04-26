import { getMall } from '@/lib/mall/mallDatabase';
import type { SpaceSuggestionsResponse } from './types';
import { SELLO_MOCK_FIXTURE } from './mock-fixture';

export type FetchMode = 'mock' | 'live';

export interface FetchOptions {
  mode?: FetchMode;
  signal?: AbortSignal;
}

function mockForMall(mallId: string): SpaceSuggestionsResponse {
  return {
    ...SELLO_MOCK_FIXTURE,
    mallId,
    mallName: getMall(mallId)?.name ?? SELLO_MOCK_FIXTURE.mallName,
    generatedAt: new Date().toISOString(),
  };
}

export async function fetchSpaceSuggestions(
  mallId: string,
  options: FetchOptions = {},
): Promise<SpaceSuggestionsResponse> {
  const { mode = 'live', signal } = options;

  if (mode === 'mock') {
    return mockForMall(mallId);
  }

  const res = await fetch(`/api/space-optimizer/suggestions?mallId=${encodeURIComponent(mallId)}`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `space-optimizer fetch failed (${res.status})`);
  }
  return (await res.json()) as SpaceSuggestionsResponse;
}

export async function fetchDemoSpaceSuggestions(
  mallId: string,
  options: { signal?: AbortSignal; preferLive?: boolean } = {},
): Promise<SpaceSuggestionsResponse> {
  const { signal, preferLive = false } = options;
  if (!preferLive) {
    return mockForMall(mallId);
  }
  try {
    const res = await fetch(`/api/demo/space-optimizer?mallId=${encodeURIComponent(mallId)}`, { signal });
    if (!res.ok) throw new Error(`demo space-optimizer ${res.status}`);
    return (await res.json()) as SpaceSuggestionsResponse;
  } catch {
    return mockForMall(mallId);
  }
}
