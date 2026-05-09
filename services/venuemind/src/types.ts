export type VenueMarket = 'FI' | 'AE' | 'SG';

export type VenueEventType =
  | 'concert'
  | 'sport'
  | 'festival'
  | 'family'
  | 'conference';

export interface VenueMindEvent {
  id: string;
  title: string;
  category: VenueEventType;
  date: string;
  expectedGuests: number;
  note: string;
}

export interface VenueMindZone {
  id: string;
  name: string;
  category: 'arrival' | 'bowl' | 'hospitality' | 'concourse' | 'transport';
  capacity?: number;
  sensorReady: boolean;
}

export interface VenueMindDemo {
  id: string;
  name: string;
  city: string;
  country: VenueMarket;
  capacity: number;
  annualVisitors?: number;
  annualEvents?: number;
  theme: { primary: string; secondary: string; accent: string };
  events: VenueMindEvent[];
  zones: VenueMindZone[];
}
