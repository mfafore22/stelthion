export type FloorplanFloor = 'ground' | 'upper';

export interface FloorplanEntrancePin {
  id: string;
  labelKey: 'west' | 'central' | 'east' | 'transit';
  x: number;
  y: number;
}

const GENERIC_LARGE_MALL_FLOORPLANS: Record<FloorplanFloor, string> = {
  ground: '/assets/malls/generic-large-mall/floorplan-ground.png',
  upper: '/assets/malls/generic-large-mall/floorplan-upper.png',
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
