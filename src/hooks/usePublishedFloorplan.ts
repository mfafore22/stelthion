import useSWR from 'swr';
import type { IdeaparkZone } from '@/lib/data/ideaparkZones';

export interface PublishedCamera {
  id: string;
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
    groundZones: ground?.zones?.length ? ground.zones : null,
    upperZones: upper?.zones?.length ? upper.zones : null,
    groundCameras: ground?.cameras ?? [],
    upperCameras: upper?.cameras ?? [],
    loading: loadingGround || loadingUpper,
  };
}
