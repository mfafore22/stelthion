import { useEffect, useState } from 'react';

export type Airport = {
  code: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  location: { lat: number; lon: number };
  runways: string[];
  terminals: string[];
};

type AirportsResponse = {
  data: {
    airports: Airport[];
  };
};

export function useAirports() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/airports');
        if (!response.ok) {
          throw new Error(`Failed to fetch airports: ${response.statusText}`);
        }
        const result: AirportsResponse = await response.json();
        setAirports(result.data.airports);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty array on error
        setAirports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  return { airports, loading, error };
}

export function useAirport(code: string) {
  const [airport, setAirport] = useState<Airport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setAirport(null);
      setLoading(false);
      return;
    }

    const fetchAirport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/airports/${code}`);
        if (!response.ok) {
          if (response.status === 404) {
            setAirport(null);
            setError(`Airport not found: ${code}`);
          } else {
            throw new Error(`Failed to fetch airport: ${response.statusText}`);
          }
          return;
        }
        const result = await response.json();
        setAirport(result.data.airport);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAirport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAirport();
  }, [code]);

  return { airport, loading, error };
}