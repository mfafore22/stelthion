/**
 * Events Panel Component
 * Displays nearby event venues and upcoming events
 * Shows live event data with footfall impact predictions
 */

'use client';

import React from 'react';
import { Calendar, MapPin, Users, Clock, RefreshCw, Ticket, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/mall/useEvents';

interface EventsPanelProps {
  mallId: string;
  expanded?: boolean;
}

export function EventsPanel({ mallId, expanded = false }: EventsPanelProps) {
  const { eventsData, events, venues, isLoading, isError, refresh } = useEvents(mallId, expanded ? 168 : 24);

  if (isLoading && !eventsData) {
    return (
      <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-bo-primary-600" />
          <span className="ml-2 text-sm text-bo-neutral-600">Loading events data...</span>
        </div>
      </Card>
    );
  }

  // Filter events for next 2-6 hours (or show all if expanded)
  const now = Date.now();
  const twoHoursFromNow = now + 2 * 60 * 60 * 1000;
  const sixHoursFromNow = now + 6 * 60 * 60 * 1000;

  const displayEvents = expanded
    ? events
    : events.filter((event) => {
        const eventTime = new Date(event.startTime).getTime();
        return eventTime >= twoHoursFromNow && eventTime <= sixHoursFromNow;
      });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concert':
        return '🎵';
      case 'sports':
        return '⚽';
      case 'conference':
        return '💼';
      case 'exhibition':
        return '🎨';
      case 'theater':
        return '🎭';
      default:
        return '📅';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-FI', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHoursUntil = (isoString: string) => {
    const eventTime = new Date(isoString).getTime();
    const hoursUntil = Math.round((eventTime - now) / (1000 * 60 * 60));
    if (hoursUntil < 1) return 'Starting soon';
    if (hoursUntil === 1) return 'In 1 hour';
    return `In ${hoursUntil} hours`;
  };

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-bo-info-dark" />
          <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
            {expanded ? 'Event Venues & Upcoming Events' : 'Nearby Events Impact'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          ⚠️ Unable to fetch events data - Showing cached information
        </div>
      )}

      {/* Nearby Event Venues */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-bo-neutral-700">Nearby Event Venues</h4>
        <div className="space-y-2">
          {venues.slice(0, expanded ? 10 : 3).map((venue) => (
            <div
              key={venue.id}
              className="flex items-start justify-between rounded-lg border border-bo-neutral-200/50 bg-white/50 p-3 dark:bg-slate-800/50"
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-bo-info-dark" />
                <div>
                  <div className="font-medium text-bo-neutral-950">{venue.name}</div>
                  <div className="text-xs text-bo-neutral-600">
                    {venue.distanceKm}km · {venue.walkingMinutes} min walk
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-bo-neutral-500 capitalize">
                {venue.type?.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      {displayEvents.length > 0 ? (
        <div>
          <h4 className="mb-3 text-sm font-medium text-bo-neutral-700">
            {expanded ? 'All Upcoming Events' : 'Events (Next 2-6 hours)'}
          </h4>
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-bo-neutral-200/50 bg-gradient-to-r from-blue-50 to-white p-4 dark:from-slate-800 dark:to-slate-900"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{getCategoryIcon(event.category)}</span>
                    <div>
                      <div className="font-semibold text-bo-neutral-950">{event.title}</div>
                      <div className="text-sm text-bo-neutral-600">{event.venueName}</div>
                    </div>
                  </div>
                  {event.ticketsAvailable && (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                      <Ticket className="h-3 w-3" />
                      Available
                    </span>
                  )}
                </div>

                {event.description && (
                  <div className="mb-2 text-sm text-bo-neutral-600">{event.description}</div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-bo-neutral-700">
                    <Clock className="h-4 w-4 text-bo-info-dark" />
                    <div>
                      <div className="font-medium">{formatTime(event.startTime)}</div>
                      <div className="text-xs text-bo-neutral-500">{formatHoursUntil(event.startTime)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-bo-neutral-700">
                    <MapPin className="h-4 w-4 text-bo-info-dark" />
                    <div>
                      <div className="font-medium">{event.venue.distanceKm}km away</div>
                      <div className="text-xs text-bo-neutral-500">{event.venue.walkingMinutes} min walk</div>
                    </div>
                  </div>

                  {event.estimatedAttendance && (
                    <div className="flex items-center gap-2 text-bo-neutral-700">
                      <Users className="h-4 w-4 text-bo-info-dark" />
                      <div>
                        <div className="font-medium">
                          {event.estimatedAttendance.toLocaleString()} expected
                        </div>
                        <div className="text-xs text-bo-neutral-500">Attendance</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-bo-neutral-700">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-green-600">+{event.footfallImpact.toFixed(1)}%</div>
                      <div className="text-xs text-bo-neutral-500">Footfall impact</div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-bo-neutral-500">Source: {event.source}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-bo-neutral-200/50 bg-white/50 p-6 text-center dark:bg-slate-800/50">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-bo-neutral-400" />
          <div className="text-sm text-bo-neutral-600">
            {expanded ? 'No upcoming events found' : 'No events in the next 2-6 hours'}
          </div>
        </div>
      )}

      {eventsData && (
        <div className="mt-4 text-xs text-bo-neutral-500">
          Updated: {new Date(eventsData.timestamp).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} · Showing events for next 30 days
        </div>
      )}

      {expanded && (
        <div className="mt-6 space-y-4 border-t border-bo-neutral-200/50 pt-4">
          <h4 className="font-semibold text-bo-neutral-950">Event Impact Analysis</h4>
          <div className="text-sm text-bo-neutral-700">
            Events at nearby venues drive significant footfall increases. Large concerts and sports events can
            increase mall visits by 10-60%, with peak impact occurring 2-4 hours before event start time.
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="text-sm font-medium text-bo-neutral-950">Impact Calculation Model</div>
            <div className="mt-2 space-y-1 text-xs text-bo-neutral-600">
              <div>• Event attendance size (larger = higher impact)</div>
              <div>• Distance from mall (closer = higher impact)</div>
              <div>• Event category (concerts & sports have highest impact)</div>
              <div>• Time until event (2-4h window has peak impact)</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
