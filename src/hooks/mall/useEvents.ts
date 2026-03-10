/**
 * useEvents Hook
 * Fetches real-time event data for mall locations with nearby venue information
 *
 * Features:
 * - Live event data from nearby venues
 * - Automatic mall location to venue mapping
 * - Footfall impact calculations
 * - Caching with SWR (refresh every 15 minutes)
 */

'use client';

import useSWR from 'swr';

export interface EventVenue {
  id: string;
  name: string;
  distanceKm: number;
  walkingMinutes: number;
  types: string[];
}

export interface Event {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  description?: string;
  category: 'concert' | 'sports' | 'conference' | 'exhibition' | 'theater' | 'other';
  startTime: string;
  endTime?: string;
  ticketsAvailable: boolean;
  estimatedAttendance?: number;
  source: string;
  venue: {
    id: string;
    name: string;
    distanceKm: number;
    walkingMinutes: number;
  };
  footfallImpact: number;
}

export interface EventsData {
  mallId: string;
  venues: EventVenue[];
  events: Event[];
  count: number;
  lookaheadHours: number;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Main hook to fetch events data for a mall
 */
export function useEvents(mallId: string, hours: number = 24) {
  const { data, error, isLoading, mutate } = useSWR<any>(
    mallId ? `/api/events/${mallId}` : null,
    fetcher,
    {
      refreshInterval: 900000, // Refresh every 15 minutes
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Dedupe requests within 5 minutes
    }
  );

  // Transform new API format to old format for backward compatibility
  const transformedData = data ? {
    mallId: data.mallId,
    venues: data.venues || [],
    events: data.upcomingEvents?.map((event: any) => ({
      id: event.id,
      venueId: event.venue,
      venueName: event.venue,
      title: event.title,
      description: event.description,
      category: event.category,
      startTime: `${event.startDate}T${event.startTime || '00:00'}:00`,
      endTime: event.endTime ? `${event.startDate}T${event.endTime}:00` : undefined,
      ticketsAvailable: !!event.ticketUrl,
      estimatedAttendance: event.expectedAttendance,
      source: data.dataSource,
      venue: {
        id: event.venue,
        name: event.venue,
        distanceKm: 0,
        walkingMinutes: 0,
      },
      footfallImpact: event.expectedAttendance ? Math.min(event.expectedAttendance / 1000, 15) : 5,
    })) || [],
    count: data.upcomingEvents?.length || 0,
    lookaheadHours: hours,
    timestamp: data.lastUpdated || new Date().toISOString(),
  } : undefined;

  return {
    eventsData: transformedData,
    events: transformedData?.events || [],
    venues: transformedData?.venues || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Get upcoming events (next 2-6 hours)
 */
export function useUpcomingEvents(mallId: string) {
  const { eventsData, events, isLoading, isError } = useEvents(mallId, 6);

  // Filter events that start in 2-6 hours
  const now = Date.now();
  const twoHoursFromNow = now + 2 * 60 * 60 * 1000;
  const sixHoursFromNow = now + 6 * 60 * 60 * 1000;

  const upcomingEvents = events.filter((event) => {
    const eventTime = new Date(event.startTime).getTime();
    return eventTime >= twoHoursFromNow && eventTime <= sixHoursFromNow;
  });

  return {
    upcomingEvents,
    venues: eventsData?.venues || [],
    isLoading,
    isError,
  };
}
