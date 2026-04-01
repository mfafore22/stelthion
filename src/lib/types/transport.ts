/**
 * Transport & Demographics Type Definitions
 * Data structures for HSL, Nysse, VR, Statistics Finland integration
 */

/**
 * HSL Public Transport Accessibility
 * Real-time and static data from HSL API (Helsinki region)
 */
export interface HSLAccessibility {
  mallId: string;

  // Metro connections
  metro: {
    stations: Array<{
      name: string;           // e.g., "Pasila", "Kamppi"
      lines: string[];        // e.g., ["M1", "M2"]
      walkingMinutes: number; // Walk time from mall
      frequency: number;      // Trains per hour
      peakCapacity: number;   // Passengers per hour
    }>;
    directConnection: boolean;
  };

  // Bus routes
  buses: {
    routes: Array<{
      number: string;         // e.g., "550", "415"
      frequency: number;      // Buses per hour
      destination: string;
    }>;
    stopsWithin500m: number;
  };

  // Tram routes (Helsinki only)
  trams?: {
    routes: string[];
    nearestStop: string;
    walkingMinutes: number;
  };

  // Commuter trains
  commuterTrains: {
    station: string;          // e.g., "Pasila asema"
    lines: string[];          // e.g., ["I", "K", "R", "T"]
    frequency: number;
    connections: string[];    // Major destinations
  };

  // Aggregate score
  accessibilityScore: number; // 0-100 composite score
  publicTransitShare: number; // % arriving by transit (from surveys)
}

/**
 * Nysse Public Transport Accessibility (Tampere region)
 * Real-time and static data from Nysse/Waltti Digitransit API
 */
export interface NysseAccessibility {
  mallId: string;

  // Bus routes (main public transport in Tampere)
  buses: {
    routes: Array<{
      number: string;         // e.g., "50", "59", "60"
      frequency: number;      // Buses per hour
      destination: string;
      origin?: string;        // Starting point
      travelTimeMinutes?: number;
      firstDeparture?: string; // HH:mm
      lastDeparture?: string;  // HH:mm
    }>;
    stops?: Array<{
      id: string;             // GTFS ID e.g., "tampere:3427"
      name: string;
      code: string;
    }>;
    stopsWithin500m: number;
  };

  // Trams (none in Tampere currently)
  trams?: {
    routes: string[];
    nearestStop: string;
    walkingMinutes: number;
  };

  // Commuter trains (none directly at most Tampere malls)
  commuterTrains?: {
    station: string;
    lines: string[];
    frequency: number;
    connections: string[];
  };

  // Aggregate score
  accessibilityScore: number; // 0-100 composite score
  publicTransitShare: number; // % arriving by transit
}

/**
 * VR Long-Distance Rail
 * Intercity connections for tourists/visitors
 */
export interface VRConnections {
  mallId: string;
  nearestStation: string;

  connections: Array<{
    destination: string;      // e.g., "Tampere", "Turku", "Oulu"
    dailyTrains: number;
    travelTimeMinutes: number;
    trainTypes: string[];     // e.g., ["IC", "Pendolino"]
  }>;

  // Tourism impact
  estimatedDailyTourists: number;
  seasonalVariation: Record<string, number>; // By month
}

/**
 * Statistics Finland Demographics
 * Catchment area population characteristics
 */
export interface CatchmentDemographics {
  mallId: string;

  // Catchment zones (drive time polygons)
  zones: Array<{
    driveTimeMinutes: number; // 5, 10, 15, 30 min
    postalCodes: string[];

    population: {
      total: number;
      ageGroups: {
        '0-14': number;
        '15-24': number;
        '25-44': number;
        '45-64': number;
        '65+': number;
      };
      households: number;
    };

    income: {
      medianHouseholdIncome: number; // €/year
      averageDisposableIncome: number;
      highIncomeShare: number;       // % earning >€60k
    };

    employment: {
      employmentRate: number;        // %
      students: number;
      topSectors: string[];          // e.g., ["Tech", "Retail", "Healthcare"]
    };
  }>;

  // Aggregate profile
  primaryProfile: 'urban-professional' | 'family-suburban' | 'suburban-families' | 'student' | 'mixed';
  spendingPotential: number; // Index 0-100
}

/**
 * Parking Integration
 * Parking data
 */
export interface ParkingData {
  mallId: string;

  levels: Array<{
    id: string;               // e.g., "P1", "P2", "P3"
    capacity: number;
    currentOccupancy: number;
    monthlyContracts: number; // Reserved spaces
    evChargingSpots: number;
  }>;

  totalCapacity: number;
  publicSpaces: number;       // Total - monthly contracts
  currentUtilization: number; // %

  pricing: {
    hourlyRate: number;       // €/hour
    dailyMax: number;         // €/day
    monthlyContract: number;  // €/month
  };

  // Patterns
  peakHours: Array<{ hour: number; avgUtilization: number }>;
  carArrivalShare: number;    // % arriving by car
}

/**
 * Live Departures
 * Real-time/simulated departure information
 */
export interface LiveDeparture {
  scheduledTime: string;        // HH:mm format
  realTime?: string;            // HH:mm format (if delayed)
  line: string;                 // e.g., "I", "550", "9"
  destination: string;
  platform?: string;            // Track/platform number
  delayMinutes?: number;        // Positive = delayed, negative = early
  type: 'train' | 'bus' | 'tram' | 'metro';
}

export interface LiveDepartures {
  mallId: string;
  station: string;
  lastUpdated: string;          // ISO timestamp
  trains: LiveDeparture[];      // Local commuter trains (HSL)
  buses: LiveDeparture[];
  trams?: LiveDeparture[];
  vrTrains?: LiveDeparture[];   // Long-distance trains (VR InterCity, Pendolino)
}
