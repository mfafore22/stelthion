import useSWR from 'swr';
import type { IdeaparkZone } from '@/lib/data/ideaparkZones';
import type { FloorplanFloor } from '@/lib/mall/floorplanAssets';

export interface PublishedCamera {
  id: string;
  label: string;
  x: number;
  y: number;
  angleDeg: number | null;
  fovDeg: number | null;
  rangeM: number | null;
  active: boolean;
  deviceType?: 'camera' | 'counter';
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
  byFloor: Record<string, { zones: IdeaparkZone[]; cameras: PublishedCamera[] }>;
  loading: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const SELLO_FLOORS: FloorplanFloor[] = ['p1', 'floor1', 'floor2', 'floor3', 'floor4'];

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
  const isSello = mallId === 'realidea-sello';
  const { data: p1, isLoading: loadingP1 } = useSWR<FloorplanResponse>(isSello ? `/api/floorplan/${mallId}?floor=p1` : null, fetcher);
  const { data: floor1, isLoading: loadingF1 } = useSWR<FloorplanResponse>(isSello ? `/api/floorplan/${mallId}?floor=floor1` : null, fetcher);
  const { data: floor2, isLoading: loadingF2 } = useSWR<FloorplanResponse>(isSello ? `/api/floorplan/${mallId}?floor=floor2` : null, fetcher);
  const { data: floor3, isLoading: loadingF3 } = useSWR<FloorplanResponse>(isSello ? `/api/floorplan/${mallId}?floor=floor3` : null, fetcher);
  const { data: floor4, isLoading: loadingF4 } = useSWR<FloorplanResponse>(isSello ? `/api/floorplan/${mallId}?floor=floor4` : null, fetcher);
  const selloData = { p1, floor1, floor2, floor3, floor4 };
  const byFloor = Object.fromEntries((isSello ? SELLO_FLOORS : ['ground', 'upper'] as FloorplanFloor[]).map((floor) => {
    const source = isSello ? selloData[floor as keyof typeof selloData] : floor === 'ground' ? ground : upper;
    return [floor, { zones: source?.zones ?? [], cameras: source?.cameras ?? [] }];
  }));

  return {
    groundZones: ground?.zones?.length ? ground.zones : null,
    upperZones: upper?.zones?.length ? upper.zones : null,
    groundCameras: ground?.cameras ?? [],
    upperCameras: upper?.cameras ?? [],
    byFloor,
    loading: loadingGround || loadingUpper || loadingP1 || loadingF1 || loadingF2 || loadingF3 || loadingF4,
  };
}
