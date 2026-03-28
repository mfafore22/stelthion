import useSWR from 'swr';
import type { IdeaparkZone } from '@/lib/data/ideaparkZones';

export interface PublishedCamera {
  id: string;
  deviceType?: 'camera' | 'counter';
  label: string;
  x: number;
  y: number;
  angleDeg: number | null;
  fovDeg: number | null;
  rangeM: number | null;
  active: boolean;
}

interface FloorplanResponse {
  zones: IdeaparkZone[];
  cameras?: PublishedCamera[];
  entrances: unknown[];
}

interface PublishedFloorplan {
  groundZones: IdeaparkZone[] | null;
  upperZones: IdeaparkZone[] | null;
  groundCameras: PublishedCamera[];
  upperCameras: PublishedCamera[];
  loading: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePublishedFloorplan(mallId: string): PublishedFloorplan {
  const { data: ground, isLoading: loadingGround } = useSWR<FloorplanResponse>(
    `/api/floorplan/${mallId}?floor=ground`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 300_000 },
  );

  const { data: upper, isLoading: loadingUpper } = useSWR<FloorplanResponse>(
    `/api/floorplan/${mallId}?floor=upper`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 300_000 },
  );

  return {
    // Return the array as-is once loaded (even if empty) so the consumer
    // can distinguish "API returned 0 zones" from "still loading".
    // null = not yet loaded, [] = loaded but empty.
    groundZones: ground ? (ground.zones ?? []) : null,
    upperZones: upper ? (upper.zones ?? []) : null,
    groundCameras: ground?.cameras ?? [],
    upperCameras: upper?.cameras ?? [],
    loading: loadingGround || loadingUpper,
  };
}
