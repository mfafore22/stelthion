export type FloorplanFloor = 'ground' | 'upper' | 'p1' | 'floor1' | 'floor2' | 'floor3' | 'floor4';

export interface FloorplanEntrancePin {
  id: string;
  labelKey: 'west' | 'central' | 'east' | 'transit';
  x: number;
  y: number;
}

const GENERIC_LARGE_MALL_FLOORPLANS: Record<FloorplanFloor, string> = {
  ground: '/assets/malls/generic-large-mall/floorplan-ground.png',
  upper: '/assets/malls/generic-large-mall/floorplan-upper.png',
  p1: '/assets/malls/generic-large-mall/floorplan-ground.png',
  floor1: '/assets/malls/generic-large-mall/floorplan-ground.png',
  floor2: '/assets/malls/generic-large-mall/floorplan-upper.png',
  floor3: '/assets/malls/generic-large-mall/floorplan-upper.png',
  floor4: '/assets/malls/generic-large-mall/floorplan-upper.png',
};

const SELLO_FLOORPLANS: Partial<Record<FloorplanFloor, string>> = {
  ground: '/assets/malls/sello/floorplans/floor-1.png',
  upper: '/assets/malls/sello/floorplans/floor-2.png',
  p1: '/assets/malls/sello/floorplans/p1.png',
  floor1: '/assets/malls/sello/floorplans/floor-1.png',
  floor2: '/assets/malls/sello/floorplans/floor-2.png',
  floor3: '/assets/malls/sello/floorplans/floor-3.png',
  floor4: '/assets/malls/sello/floorplans/floor-4.png',
};

export const GENERIC_LARGE_MALL_GROUND_ENTRANCES: FloorplanEntrancePin[] = [
  { id: 'west', labelKey: 'west', x: 90, y: 352 },
  { id: 'central', labelKey: 'central', x: 752, y: 88 },
  { id: 'east', labelKey: 'east', x: 1414, y: 352 },
  { id: 'transit', labelKey: 'transit', x: 752, y: 640 },
];

export function getGenericLargeMallFloorplan(floor: FloorplanFloor): string {
  return GENERIC_LARGE_MALL_FLOORPLANS[floor];
}

export function getMallFloorplan(mallId: string, floor: FloorplanFloor): string {
  return mallId === 'realidea-sello'
    ? SELLO_FLOORPLANS[floor] ?? getGenericLargeMallFloorplan(floor)
    : getGenericLargeMallFloorplan(floor);
}
