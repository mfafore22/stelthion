import useSWR from 'swr';
import type { IdeaparkZone } from '@/lib/data/ideaparkZones';
import type { StorePosition } from '@/lib/data/ideaparkStorePositions';

interface FloorplanResponse {
  zones: IdeaparkZone[];
  stores: StorePosition[];
  entrances: unknown[];
}

interface PublishedFloorplan {
  groundZones: IdeaparkZone[] | null;
  upperZones: IdeaparkZone[] | null;
  groundStores: StorePosition[] | null;
  upperStores: StorePosition[] | null;
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
    groundStores: ground?.stores?.length ? ground.stores : null,
    upperStores: upper?.stores?.length ? upper.stores : null,
    loading: loadingGround || loadingUpper,
  };
}
