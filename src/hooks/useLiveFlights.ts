import { useEffect, useMemo, useState } from 'react';
import type { LiveFlightCollection } from '@/types/flight-tracker';
import { emptyFlightCollection } from '@/types/flight-tracker';

interface UseLiveFlightsOptions {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  refreshMs?: number;
}

interface UseLiveFlightsResult {
  flights: LiveFlightCollection;
  loading: boolean;
  error: string | null;
  source: 'flighttracker24' | 'mock' | 'mock-fallback' | 'mock-error' | null;
}

export function useLiveFlights(options: UseLiveFlightsOptions = {}): UseLiveFlightsResult {
  const { lat = 25.273056, lng = 51.608056, radiusKm = 80, refreshMs = 30000 } = options;
  const [flights, setFlights] = useState<LiveFlightCollection>(emptyFlightCollection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<UseLiveFlightsResult['source']>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('lat', lat.toString());
    params.set('lng', lng.toString());
    params.set('radius', radiusKm.toString());
    return params.toString();
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const fetchFlights = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/flights/live?${query}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (cancelled) return;

        setFlights(payload?.data ?? emptyFlightCollection);
        setSource(payload?.source ?? null);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch live flights', err);
        setFlights(emptyFlightCollection);
        setSource(null);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) {
          setLoading(false);
          timeout = setTimeout(fetchFlights, refreshMs);
        }
      }
    };

    void fetchFlights();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, refreshMs]);

  return { flights, loading, error, source };
}
