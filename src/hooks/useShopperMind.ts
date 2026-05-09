'use client';

import useSWR from 'swr';
import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface PhenomenonSummary {
  id: string;
  label: string;
  description: string;
  primaryCountry: string;
  categories: string[];
  state: PhenomenonStateValue;
  lastSignalAt: string;
  scores: {
    date: string;
    compositeScore: number;
    velocity: number;
    acceleration: number;
    volume: number;
  }[];
  _count: { signals: number; feedback: number };
}

export interface PhenomenaListResponse {
  phenomena: PhenomenonSummary[];
  total: number;
  page: number;
  limit: number;
}

export function usePhenomena(params: {
  country?: string;
  state?: string;
  category?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (params.country) sp.set('country', params.country);
  if (params.state) sp.set('state', params.state);
  if (params.category) sp.set('category', params.category);
  if (params.page) sp.set('page', String(params.page));

  const key = `/api/shoppermind/phenomena?${sp.toString()}`;
  return useSWR<PhenomenaListResponse>(key, fetcher, { refreshInterval: 60_000 });
}

export function usePhenomenonDetail(id: string | null) {
  return useSWR(id ? `/api/shoppermind/phenomena/${id}` : null, fetcher);
}

export function useSignalsOfTheDay(country?: string) {
  const sp = country ? `?country=${country}` : '';
  return useSWR(`/api/shoppermind/signals-of-the-day${sp}`, fetcher, { refreshInterval: 300_000 });
}

export function useShopperMindSearch(query: string, country?: string) {
  const sp = new URLSearchParams({ q: query });
  if (country) sp.set('country', country);
  return useSWR(
    query.length >= 2 ? `/api/shoppermind/search?${sp.toString()}` : null,
    fetcher,
    { dedupingInterval: 1000 },
  );
}
