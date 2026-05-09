export type VenueMarket = 'FI' | 'AE' | 'SG';

export interface VenueDemoEvent {
  id: string;
  title: string;
  category: 'concert' | 'sport' | 'festival' | 'family' | 'conference';
  date: string;
  expectedGuests: number;
  note: string;
}

export interface VenueDemoZone {
  id: string;
  name: string;
  category: 'arrival' | 'bowl' | 'hospitality' | 'concourse' | 'transport';
  capacity?: number;
  sensorReady: boolean;
}

export interface VenueDemo {
  id: string;
  name: string;
  city: string;
  country: VenueMarket;
  capacity: number;
  annualVisitors?: number;
  annualEvents?: number;
  theme: { primary: string; secondary: string; accent: string };
  events: VenueDemoEvent[];
  zones: VenueDemoZone[];
}
