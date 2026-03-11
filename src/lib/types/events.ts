/**
 * Events Type Definitions
 * Data structures for surrounding venue events
 */

export interface VenueEvent {
  id: string;
  title: string;
  venue: string;
  startDate: string;         // ISO date
  endDate?: string;          // ISO date (for multi-day events)
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  category: 'concert' | 'sports' | 'exhibition' | 'conference' | 'festival' | 'other';
  expectedAttendance?: number;
  description?: string;
  ticketUrl?: string;
  imageUrl?: string;
}

export interface VenueInfo {
  id: string;
  name: string;
  distanceKm: number;
  walkingMinutes: number;
  type: 'arena' | 'exhibition-center' | 'concert-hall' | 'stadium' | 'other';
  imageUrl?: string;
}

export interface EventsData {
  mallId: string;
  venues: VenueInfo[];
  upcomingEvents: VenueEvent[];
  dataSource: string;
  lastUpdated: string;
}
