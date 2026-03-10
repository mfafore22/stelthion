/**
 * Ideapark Lempäälä — Transport, Demographics & Parking Data
 *
 * Sources:
 * - Nysse (Tampere regional transport) timetables
 * - VR timetables (Lempäälä asema on Helsinki–Tampere main line)
 * - Statistics Finland — Lempäälä / Tampere south region
 * - Ideapark parking system (free public parking)
 */

import type {
  NysseAccessibility,
  VRConnections,
  CatchmentDemographics,
  ParkingData,
  LiveDepartures,
  LiveDeparture,
} from '@/lib/types/transport';

/**
 * Nysse Public Transport Accessibility
 * Ideapark is accessible mainly by regional bus from Tampere.
 * Lempäälä asema (VR) is ~2 km from Ideapark.
 */
export const ideaparkNysseAccessibility: NysseAccessibility = {
  mallId: 'ideapark',

  buses: {
    routes: [
      {
        number: '50',
        frequency: 3,
        destination: 'Tampere (Keskustori)',
        origin: 'Lempäälä',
        travelTimeMinutes: 45,
        firstDeparture: '06:00',
        lastDeparture: '22:00',
      },
      {
        number: '59',
        frequency: 2,
        destination: 'Tampere (Pyynikki)',
        origin: 'Lempäälä',
        travelTimeMinutes: 50,
        firstDeparture: '06:30',
        lastDeparture: '21:00',
      },
      {
        number: '60',
        frequency: 2,
        destination: 'Tampere (Lentävänniemi)',
        origin: 'Lempäälä',
        travelTimeMinutes: 55,
        firstDeparture: '07:00',
        lastDeparture: '20:30',
      },
    ],
    stops: [
      { id: 'nysse:ideapark-p', name: 'Ideapark pysäkki', code: 'IP1' },
      { id: 'nysse:lempaala-as', name: 'Lempäälä asema', code: 'LA1' },
    ],
    stopsWithin500m: 3,
  },

  accessibilityScore: 52, // Mainly car-based suburban mall
  publicTransitShare: 8,  // ~8% arrive by public transport
};

/**
 * VR Long-Distance Rail Connections
 * Lempäälä asema is on the Helsinki–Tampere main line.
 * IC and regional trains stop here (2 km from Ideapark).
 */
export const ideaparkVRConnections: VRConnections = {
  mallId: 'ideapark',
  nearestStation: 'Lempäälä asema',

  connections: [
    {
      destination: 'Tampere',
      dailyTrains: 14,
      travelTimeMinutes: 25,
      trainTypes: ['IC', 'Taajamajuna'],
    },
    {
      destination: 'Helsinki',
      dailyTrains: 14,
      travelTimeMinutes: 95,
      trainTypes: ['IC', 'Pendolino'],
    },
    {
      destination: 'Turku',
      dailyTrains: 6,
      travelTimeMinutes: 130,
      trainTypes: ['IC'],
    },
    {
      destination: 'Oulu',
      dailyTrains: 6,
      travelTimeMinutes: 330,
      trainTypes: ['IC', 'Night train'],
    },
  ],

  estimatedDailyTourists: 120,
  seasonalVariation: {
    '01': 0.85,
    '02': 0.88,
    '03': 0.92,
    '04': 0.98,
    '05': 1.05,
    '06': 1.15,
    '07': 1.20,
    '08': 1.10,
    '09': 1.00,
    '10': 0.95,
    '11': 1.08,
    '12': 1.25,
  },
};

/**
 * Catchment Demographics
 * Statistics Finland data for Lempäälä and surrounding municipalities.
 */
export const ideaparkCatchmentDemographics: CatchmentDemographics = {
  mallId: 'ideapark',

  zones: [
    // 5-minute drive (Lempäälä centre + Marjamäki)
    {
      driveTimeMinutes: 5,
      postalCodes: ['37550', '37560'],
      population: {
        total: 8200,
        ageGroups: {
          '0-14': 1640,   // 20% — families with children
          '15-24': 1230,  // 15%
          '25-44': 2460,  // 30%
          '45-64': 1968,  // 24%
          '65+': 902,     // 11%
        },
        households: 3400,
      },
      income: {
        medianHouseholdIncome: 48000,
        averageDisposableIncome: 35000,
        highIncomeShare: 18,
      },
      employment: {
        employmentRate: 74,
        students: 820,
        topSectors: ['Manufacturing', 'Retail', 'Healthcare', 'Education'],
      },
    },

    // 10-minute drive (Lempäälä municipality + Sääksjärvi + Kulju)
    {
      driveTimeMinutes: 10,
      postalCodes: ['37550', '37530', '37510', '37560'],
      population: {
        total: 23500,
        ageGroups: {
          '0-14': 4935,   // 21%
          '15-24': 3290,  // 14%
          '25-44': 7285,  // 31%
          '45-64': 5640,  // 24%
          '65+': 2350,    // 10%
        },
        households: 9800,
      },
      income: {
        medianHouseholdIncome: 50000,
        averageDisposableIncome: 37000,
        highIncomeShare: 20,
      },
      employment: {
        employmentRate: 76,
        students: 2350,
        topSectors: ['Manufacturing', 'Logistics', 'Retail', 'Construction', 'Healthcare'],
      },
    },

    // 15-minute drive (Pirkkala + south Tampere)
    {
      driveTimeMinutes: 15,
      postalCodes: ['33960', '37550', '37530', '37510', '33800', '33820'],
      population: {
        total: 58000,
        ageGroups: {
          '0-14': 11600,  // 20%
          '15-24': 8120,  // 14%
          '25-44': 17980, // 31%
          '45-64': 13920, // 24%
          '65+': 6380,    // 11%
        },
        households: 24000,
      },
      income: {
        medianHouseholdIncome: 52000,
        averageDisposableIncome: 39000,
        highIncomeShare: 22,
      },
      employment: {
        employmentRate: 78,
        students: 7540,
        topSectors: ['Tech', 'Manufacturing', 'Healthcare', 'Retail', 'Logistics'],
      },
    },

    // 30-minute drive (Greater Tampere area)
    {
      driveTimeMinutes: 30,
      postalCodes: [
        '33100', '33200', '33300', '33400', '33500', '33700', '33710',
        '33720', '33730', '33800', '33820', '33840', '33850', '33870',
        '33900', '37200', '37800',
      ],
      population: {
        total: 215000,
        ageGroups: {
          '0-14': 36550,  // 17%
          '15-24': 36550, // 17% (university city)
          '25-44': 73100, // 34%
          '45-64': 47300, // 22%
          '65+': 21500,   // 10%
        },
        households: 102000,
      },
      income: {
        medianHouseholdIncome: 54000,
        averageDisposableIncome: 40500,
        highIncomeShare: 25,
      },
      employment: {
        employmentRate: 79,
        students: 38700,
        topSectors: ['Tech', 'Healthcare', 'Education', 'Manufacturing', 'Professional services'],
      },
    },
  ],

  primaryProfile: 'family-suburban',
  spendingPotential: 62,
};

/**
 * Parking Data
 * Ideapark has large free surface parking (~3500 spaces).
 * No time limits or fees during mall opening hours.
 */
export const ideaparkParkingData: ParkingData = {
  mallId: 'ideapark',

  levels: [
    {
      id: 'P1',
      capacity: 1800,
      currentOccupancy: 420,
      monthlyContracts: 0,
      evChargingSpots: 48,
    },
    {
      id: 'P2',
      capacity: 1200,
      currentOccupancy: 280,
      monthlyContracts: 0,
      evChargingSpots: 32,
    },
    {
      id: 'P3-Covered',
      capacity: 500,
      currentOccupancy: 95,
      monthlyContracts: 40,
      evChargingSpots: 20,
    },
  ],

  totalCapacity: 3500,
  publicSpaces: 3460,
  currentUtilization: 23.0,

  pricing: {
    hourlyRate: 0,     // Free parking
    dailyMax: 0,
    monthlyContract: 0,
  },

  peakHours: [
    { hour: 9,  avgUtilization: 12 },
    { hour: 10, avgUtilization: 22 },
    { hour: 11, avgUtilization: 38 },
    { hour: 12, avgUtilization: 52 },
    { hour: 13, avgUtilization: 62 },
    { hour: 14, avgUtilization: 72 },
    { hour: 15, avgUtilization: 78 },
    { hour: 16, avgUtilization: 75 },
    { hour: 17, avgUtilization: 65 },
    { hour: 18, avgUtilization: 52 },
    { hour: 19, avgUtilization: 40 },
    { hour: 20, avgUtilization: 25 },
    { hour: 21, avgUtilization: 12 },
  ],

  carArrivalShare: 88,
};

/**
 * Time-aware parking snapshot
 */
export function getIdeaparkParkingSnapshot(date: Date = new Date()): ParkingData {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();

  const baseUtil = ideaparkParkingData.peakHours.find(h => h.hour === hour)?.avgUtilization ?? 20;

  let multiplier = 1.0;
  if (dayOfWeek === 0) multiplier = 0.90;      // Sunday
  else if (dayOfWeek === 6) multiplier = 1.15; // Saturday
  else if (dayOfWeek >= 1 && dayOfWeek <= 5) multiplier = 0.95; // Weekday

  const adjUtil = Math.min(95, baseUtil * multiplier);

  const updatedLevels = ideaparkParkingData.levels.map(level => {
    const occupied = Math.round((adjUtil / 100) * (level.capacity - level.monthlyContracts));
    const variation = Math.floor(Math.random() * 10) - 5;
    return {
      ...level,
      currentOccupancy: Math.max(0, Math.min(level.capacity, occupied + level.monthlyContracts + variation)),
    };
  });

  const totalOccupied = updatedLevels.reduce((s, l) => s + l.currentOccupancy, 0);

  return {
    ...ideaparkParkingData,
    levels: updatedLevels,
    currentUtilization: Number(((totalOccupied / ideaparkParkingData.totalCapacity) * 100).toFixed(1)),
  };
}

/**
 * Live departures from Lempäälä asema (VR) and Ideapark bus stop (Nysse)
 */
export function getIdeaparkLiveDepartures(date: Date = new Date()): LiveDepartures {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const fmt = (min: number): string => {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // VR trains — Helsinki–Tampere line, stop at Lempäälä
  const vrLines = [
    { line: 'IC', destinations: ['Tampere', 'Helsinki', 'Tampere', 'Helsinki'], interval: 60 },
    { line: 'S', destinations: ['Tampere', 'Helsinki'], interval: 120 },
  ];

  const vrTrains: LiveDeparture[] = [];
  vrLines.forEach(({ line, destinations, interval }) => {
    for (let i = 0; i < 4; i++) {
      const scheduled = currentMinutes + i * interval + Math.floor(Math.random() * 8);
      if (scheduled > currentMinutes + 180) break;
      const delay = Math.random() < 0.15 ? Math.floor(Math.random() * 5) + 1 : 0;
      vrTrains.push({
        scheduledTime: fmt(scheduled),
        realTime: delay ? fmt(scheduled + delay) : undefined,
        line,
        destination: destinations[i % destinations.length],
        platform: i % 2 === 0 ? '1' : '2',
        delayMinutes: delay || undefined,
        type: 'train',
      });
    }
  });
  vrTrains.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  // Nysse buses
  const nysseRoutes = [
    { number: '50', destination: 'Tampere (Keskustori)', interval: 20 },
    { number: '59', destination: 'Tampere (Pyynikki)', interval: 30 },
    { number: '60', destination: 'Tampere (Lentävänniemi)', interval: 30 },
  ];

  const buses: LiveDeparture[] = [];
  nysseRoutes.forEach(({ number, destination, interval }) => {
    const count = Math.ceil(90 / interval);
    for (let i = 0; i < count; i++) {
      const scheduled = currentMinutes + i * interval + Math.floor(Math.random() * 4);
      if (scheduled > currentMinutes + 90) break;
      const delay = Math.random() < 0.25 ? Math.floor(Math.random() * 4) + 1 : 0;
      buses.push({
        scheduledTime: fmt(scheduled),
        realTime: delay ? fmt(scheduled + delay) : undefined,
        line: number,
        destination,
        delayMinutes: delay || undefined,
        type: 'bus',
      });
    }
  });
  buses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return {
    mallId: 'ideapark',
    station: 'Lempäälä asema',
    lastUpdated: date.toISOString(),
    trains: [],
    buses: buses.slice(0, 12),
    vrTrains: vrTrains.slice(0, 8),
  };
}
