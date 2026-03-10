/**
 * Events Calendar Component
 * Displays upcoming events from surrounding venues with filtering
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { Calendar, MapPin, Users, ExternalLink, Music, Trophy, Briefcase, Sparkles, Filter } from 'lucide-react';
import type { EventsData, VenueEvent } from '@/lib/types/events';
import { Button } from '@/components/ui/button';

interface EventsCalendarProps {
  eventsData: EventsData;
}

// Category icons and colors
const categoryConfig = {
  concert: { icon: Music, color: 'text-bo-accent-700', bg: 'bg-bo-accent-100', border: 'border-bo-accent-300' },
  sports: { icon: Trophy, color: 'text-bo-success-dark', bg: 'bg-bo-success-light/70', border: 'border-bo-success/30' },
  exhibition: { icon: Briefcase, color: 'text-bo-info-dark', bg: 'bg-bo-info-100', border: 'border-bo-info-300' },
  conference: { icon: Briefcase, color: 'text-bo-primary-700', bg: 'bg-bo-primary-100', border: 'border-bo-primary-300' },
  festival: { icon: Sparkles, color: 'text-bo-warning-dark', bg: 'bg-bo-warning-light/70', border: 'border-bo-warning/30' },
  other: { icon: Calendar, color: 'text-bo-neutral-700', bg: 'bg-bo-neutral-200', border: 'border-bo-neutral-300' },
};

export function EventsCalendar({ eventsData }: EventsCalendarProps) {
  const [selectedVenue, setSelectedVenue] = React.useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = React.useState(false);

  // Format date display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if today or tomorrow
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    // Otherwise show day and date
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Format time
  const formatTime = (time?: string): string => {
    if (!time) return '';
    return time.substring(0, 5); // HH:mm
  };

  // Format number with K suffix
  const formatAttendance = (num?: number): string => {
    if (!num) return 'N/A';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Filter events by selected venue
  const filteredEvents = React.useMemo(() => {
    if (!selectedVenue) return eventsData.upcomingEvents;

    // Normalize venue names for matching (handle variations like "Messukeskus" vs "Messukeskus Helsinki")
    return eventsData.upcomingEvents.filter(event => {
      const eventVenue = event.venue.toLowerCase();
      const selected = selectedVenue.toLowerCase();
      return eventVenue.includes(selected) || selected.includes(eventVenue);
    });
  }, [eventsData.upcomingEvents, selectedVenue]);

  // Limit to 5 or 10 events based on showAllEvents
  const displayedEvents = showAllEvents ? filteredEvents : filteredEvents.slice(0, 5);

  // Group events by date
  const eventsByDate = displayedEvents.reduce((acc, event) => {
    const date = event.startDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, VenueEvent[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="space-y-6">
      {/* Nearby Venues Overview with Images and Filtering */}
      <MallCard variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
            Nearby Event Venues
          </h3>
          {selectedVenue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVenue(null)}
              className="gap-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              Show all venues
            </Button>
          )}
        </div>
        {eventsData?.venues && Array.isArray(eventsData.venues) && eventsData.venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsData.venues.map((venue, index) => (
              <button
                key={`${venue.name}-${index}`}
                onClick={() => setSelectedVenue(selectedVenue === venue.name ? null : venue.name)}
                className={`rounded-lg overflow-hidden relative bg-white/50 backdrop-blur-sm border-2 transition-all shadow-sm hover:shadow-md min-h-[140px] text-left w-full ${
                  selectedVenue === venue.name
                    ? 'border-bo-primary-600 ring-2 ring-bo-primary-300'
                    : 'border-bo-neutral-300/50 hover:border-bo-primary-400'
                }`}
              >
                {/* Venue Image */}
                {venue.imageUrl && (
                  <div className="relative h-24 w-full overflow-hidden">
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedVenue === venue.name && (
                      <div className="absolute inset-0 bg-bo-primary-600/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2">
                          <Filter className="h-5 w-5 text-bo-primary-600" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Venue Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className={`h-5 w-5 flex-shrink-0 mt-0.5 ${selectedVenue === venue.name ? 'text-bo-primary-600' : 'text-bo-primary-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-base font-semibold mb-1 leading-tight ${selectedVenue === venue.name ? 'text-bo-primary-800' : 'text-bo-neutral-950'}`}>
                        {venue.name}
                      </div>
                      <div className="text-sm text-bo-neutral-700 font-medium">
                        {venue.distanceKm}km · {venue.walkingMinutes} min walk
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-bo-neutral-600">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No venue information available</p>
          </div>
        )}
      </MallCard>

      {/* Upcoming Events */}
      <MallCard variant="glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
              {selectedVenue ? `Events at ${selectedVenue}` : 'Upcoming Events'}
            </h3>
            <p className="text-sm text-bo-neutral-600 mt-1">
              Next 30 days · {filteredEvents.length} events
              {selectedVenue && ` · Showing ${displayedEvents.length}`}
            </p>
          </div>
          <Calendar className="h-6 w-6 text-bo-primary-600" />
        </div>

        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <div className="sticky top-0 bg-bo-glass-strong/95 backdrop-blur-sm rounded-lg px-4 py-2 mb-3 border border-bo-primary-200/30 shadow-sm z-10">
                <div className="text-sm font-semibold text-bo-primary-700">
                  {formatDate(date)}
                </div>
                <div className="text-xs text-bo-neutral-600">
                  {new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Events for this date */}
              <div className="space-y-3">
                {eventsByDate[date].map((event) => {
                  const config = categoryConfig[event.category];
                  const Icon = config.icon;

                  return (
                    <div
                      key={event.id}
                      className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30 hover:border-bo-primary-300 transition-all duration-200"
                    >
                      {/* Event Image (full width horizontal) */}
                      {event.imageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-bo-neutral-300">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Icon (only if no image) */}
                        {!event.imageUrl && (
                          <div className={`rounded-lg ${config.bg} p-3 border ${config.border} flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                        )}

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-bo-neutral-950 mb-1">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-bo-neutral-600">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.venue}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border} flex-shrink-0`}
                            >
                              {event.category}
                            </span>
                          </div>

                          {/* Time and Attendance */}
                          <div className="flex items-center gap-4 text-sm text-bo-neutral-700 mb-2">
                            {event.startTime && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                                {event.endDate && event.endDate !== event.startDate && (
                                  <span className="text-xs text-bo-neutral-600 ml-1">
                                    (multi-day)
                                  </span>
                                )}
                              </div>
                            )}
                            {event.expectedAttendance && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {formatAttendance(event.expectedAttendance)} expected
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-sm text-bo-neutral-600 leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          {/* Ticket Link */}
                          {event.ticketUrl && (
                            <a
                              href={event.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-bo-primary-700 hover:text-bo-primary-800 font-medium mt-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View tickets
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {filteredEvents.length > 5 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="gap-2"
            >
              {showAllEvents ? 'Show less' : `View more (${filteredEvents.length - 5} more events)`}
            </Button>
          </div>
        )}

        {displayedEvents.length === 0 && (
          <div className="text-center py-12 text-bo-neutral-600">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{selectedVenue ? `No upcoming events at ${selectedVenue}` : 'No upcoming events scheduled'}</p>
          </div>
        )}

        {/* Data Source */}
        <div className="mt-6 pt-4 border-t border-bo-neutral-200/30">
          <div className="flex items-start gap-2">
            {eventsData.dataSource.includes('Messukeskus.fi') && (
              <div className="flex-shrink-0 px-2 py-1 rounded bg-bo-warning-light/30 border border-bo-warning/40">
                <span className="text-xs font-semibold text-bo-warning-dark">⚠ Fallback Data</span>
              </div>
            )}
            <p className="text-xs text-bo-neutral-500">
              <strong>Sources:</strong> {eventsData.dataSource}
              {eventsData.dataSource.includes('Messukeskus.fi') && (
                <span className="block mt-1 text-bo-warning-dark">
                  Live Linked Events API is currently unavailable. Showing sample data.
                </span>
              )}
            </p>
          </div>
          {eventsData.lastUpdated && (
            <p className="text-xs text-bo-neutral-400 mt-2">
              Last updated: {new Date(eventsData.lastUpdated).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </MallCard>
    </div>
  );
}
