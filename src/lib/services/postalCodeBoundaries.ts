/**
 * Postal code boundary data for Ideapark Lempäälä catchment area.
 * Returns simplified GeoJSON-style polygon boundaries for map rendering.
 * Coordinates are approximate WGS84 for the Lempäälä / Tampere south region.
 */

export interface PostalCodeBoundary {
  code: string;
  name: string;
  /** Simplified polygon as [lng, lat] pairs */
  coordinates: [number, number][];
  center: [number, number];
  /** GeoJSON-style geometry for map rendering */
  geometry:
    | { type: 'Polygon'; coordinates: [number, number][][] }
    | { type: 'MultiPolygon'; coordinates: [number, number][][][] };
}

type BoundaryInput = Omit<PostalCodeBoundary, 'geometry'>;

const BOUNDARIES: BoundaryInput[] = [
  {
    code: '37550',
    name: 'Lempäälä keskusta',
    center: [23.757, 61.316],
    coordinates: [
      [23.730, 61.300], [23.785, 61.300], [23.785, 61.332],
      [23.730, 61.332], [23.730, 61.300],
    ],
  },
  {
    code: '37530',
    name: 'Sääksjärvi',
    center: [23.780, 61.345],
    coordinates: [
      [23.755, 61.332], [23.810, 61.332], [23.810, 61.360],
      [23.755, 61.360], [23.755, 61.332],
    ],
  },
  {
    code: '37510',
    name: 'Kulju',
    center: [23.820, 61.300],
    coordinates: [
      [23.795, 61.285], [23.850, 61.285], [23.850, 61.318],
      [23.795, 61.318], [23.795, 61.285],
    ],
  },
  {
    code: '37560',
    name: 'Ideapark / Marjamäki',
    center: [23.730, 61.360],
    coordinates: [
      [23.705, 61.348], [23.758, 61.348], [23.758, 61.374],
      [23.705, 61.374], [23.705, 61.348],
    ],
  },
  {
    code: '33960',
    name: 'Pirkkala',
    center: [23.648, 61.465],
    coordinates: [
      [23.610, 61.447], [23.690, 61.447], [23.690, 61.483],
      [23.610, 61.483], [23.610, 61.447],
    ],
  },
  {
    code: '37200',
    name: 'Valkeakoski',
    center: [24.027, 61.265],
    coordinates: [
      [23.990, 61.248], [24.065, 61.248], [24.065, 61.282],
      [23.990, 61.282], [23.990, 61.248],
    ],
  },
  {
    code: '33800',
    name: 'Tampere etelä',
    center: [23.763, 61.483],
    coordinates: [
      [23.720, 61.463], [23.808, 61.463], [23.808, 61.503],
      [23.720, 61.503], [23.720, 61.463],
    ],
  },
];

/**
 * Fetch postal code boundaries for the given list of codes.
 * Returns matching boundary data (synchronous, no network call needed for demo).
 */
export async function fetchPostalCodeBoundaries(
  postalCodes: string[]
): Promise<PostalCodeBoundary[]> {
  return BOUNDARIES
    .filter(b => postalCodes.includes(b.code))
    .map(b => ({
      ...b,
      geometry: { type: 'Polygon' as const, coordinates: [b.coordinates] } as const,
    }));
}
