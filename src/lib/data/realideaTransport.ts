import type { HSLAccessibility, VRConnections } from '@/lib/types/transport';

export type RealideaLocationMallId = 'realidea-sello' | 'realidea-tripla';

const seasonalVariation = {
  '01': 0.9, '02': 0.92, '03': 0.96, '04': 1.0, '05': 1.05, '06': 1.08,
  '07': 1.0, '08': 1.04, '09': 1.08, '10': 1.06, '11': 1.12, '12': 1.25,
};

export const realideaHslAccessibility: Record<RealideaLocationMallId, HSLAccessibility> = {
  'realidea-sello': {
    mallId: 'realidea-sello',
    metro: { stations: [], directConnection: false },
    buses: {
      routes: [
        { number: '200', frequency: 8, destination: 'Helsinki / Elielinaukio' },
        { number: '201', frequency: 6, destination: 'Leppävaara - Espoon keskus' },
        { number: '550', frequency: 10, destination: 'Itäkeskus / Tapiola' },
        { number: '555', frequency: 4, destination: 'Martinlaakso / Keilaniemi' },
      ],
      stopsWithin500m: 18,
    },
    commuterTrains: {
      station: 'Leppävaara asema',
      lines: ['A', 'E', 'L', 'U', 'Y'],
      frequency: 20,
      connections: ['Helsinki keskusta', 'Espoon keskus', 'Kirkkonummi', 'Siuntio'],
    },
    accessibilityScore: 92,
    publicTransitShare: 41,
  },
  'realidea-tripla': {
    mallId: 'realidea-tripla',
    metro: { stations: [], directConnection: false },
    buses: {
      routes: [
        { number: '23', frequency: 6, destination: 'Rautatientori / Ruskeasuo' },
        { number: '40', frequency: 6, destination: 'Elielinaukio / Kannelmäki' },
        { number: '500', frequency: 8, destination: 'Itäkeskus / Munkkivuori' },
        { number: '510', frequency: 8, destination: 'Herttoniemi / Tapiola' },
        { number: '600', frequency: 4, destination: 'Helsinki Airport' },
      ],
      stopsWithin500m: 24,
    },
    trams: { routes: ['2', '7', '9', '13'], nearestStop: 'Pasilan asema / Tripla', walkingMinutes: 1 },
    commuterTrains: {
      station: 'Pasila asema',
      lines: ['A', 'E', 'I', 'K', 'L', 'P', 'R', 'T', 'U', 'Y', 'Z'],
      frequency: 45,
      connections: ['Helsinki keskusta', 'Lentoasema', 'Tampere', 'Lahti', 'Kirkkonummi'],
    },
    accessibilityScore: 98,
    publicTransitShare: 58,
  },
};

export const realideaVRConnections: Record<RealideaLocationMallId, VRConnections> = {
  'realidea-sello': {
    mallId: 'realidea-sello',
    nearestStation: 'Pasila asema',
    connections: [
      { destination: 'Tampere', dailyTrains: 36, travelTimeMinutes: 95, trainTypes: ['IC', 'Pendolino'] },
      { destination: 'Turku', dailyTrains: 18, travelTimeMinutes: 125, trainTypes: ['IC'] },
    ],
    estimatedDailyTourists: 260,
    seasonalVariation,
  },
  'realidea-tripla': {
    mallId: 'realidea-tripla',
    nearestStation: 'Pasila asema',
    connections: [
      { destination: 'Tampere', dailyTrains: 36, travelTimeMinutes: 85, trainTypes: ['IC', 'Pendolino'] },
      { destination: 'Turku', dailyTrains: 18, travelTimeMinutes: 115, trainTypes: ['IC'] },
      { destination: 'Lahti', dailyTrains: 30, travelTimeMinutes: 45, trainTypes: ['Z', 'IC'] },
      { destination: 'Oulu', dailyTrains: 10, travelTimeMinutes: 360, trainTypes: ['IC', 'Night train'] },
    ],
    estimatedDailyTourists: 1850,
    seasonalVariation,
  },
};

export function getRealideaTransport(mallId: string) {
  const id = mallId as RealideaLocationMallId;
  if (!realideaHslAccessibility[id]) return null;
  return { hsl: realideaHslAccessibility[id], vr: realideaVRConnections[id] };
}
