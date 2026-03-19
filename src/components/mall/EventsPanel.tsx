/**
 * Events Panel Component
 * Displays nearby event venues and upcoming events
 * Shows live event data with footfall impact predictions
 */

'use client';

import Image from 'next/image';
import { Calendar, MapPin, Users, Clock, RefreshCw, Ticket, TrendingUp } from 'lucide-react';
import { SwirlLoader } from '@/components/ui/SwirlLoader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/mall/useEvents';
import { useTranslation } from 'react-i18next';

interface EventsPanelProps {
  mallId: string;
  expanded?: boolean;
}

export function EventsPanel({ mallId, expanded = false }: EventsPanelProps) {
  const { t, i18n } = useTranslation('mall');
  const { eventsData, events: rawEvents, venues: rawVenues, isLoading, isError, refresh } = useEvents(mallId, expanded ? 168 : 24);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = rawEvents as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const venues = rawVenues as any[];

  if (isLoading && !eventsData) {
    return (
      <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
        <div className="flex items-center justify-center py-8">
          <SwirlLoader size="md" />
          <span className="ml-2 text-sm text-bo-neutral-600">{t('events.loadingData')}</span>
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
      case 'concert': return '🎵';
      case 'sports': return '⚽';
      case 'conference': return '💼';
      case 'exhibition': return '🎨';
      case 'theater': return '🎭';
      default: return '📅';
    }
  };

  const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-GB';

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatHoursUntil = (isoString: string) => {
    const eventTime = new Date(isoString).getTime();
    const hoursUntil = Math.round((eventTime - now) / (1000 * 60 * 60));
    if (hoursUntil < 1) return t('events.startingSoon');
    if (hoursUntil === 1) return t('events.inOneHour');
    return t('events.inHours', { count: hoursUntil });
  };

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-bo-info-dark" />
          <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
            {expanded ? t('events.venuesAndUpcoming') : t('events.nearbyImpact')}
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
          {t('events.refresh')}
        </Button>
      </div>

      {isError && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          ⚠️ {t('events.fetchError')}
        </div>
      )}

      {/* Nearby Event Venues */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-bo-neutral-700">{t('events.nearbyVenues')}</h4>
        <div className="space-y-2">
          {venues.slice(0, expanded ? 10 : 3).map((venue) => (
            <div
              key={venue.id}
              className="flex items-start justify-between rounded-lg border border-bo-neutral-200/50 bg-white/80 p-3 dark:bg-slate-800/50"
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-bo-info-dark" />
                <div>
                  <div className="font-medium text-bo-neutral-950">{venue.name}</div>
                  <div className="text-xs text-bo-neutral-600">
                    {t('events.distanceAndWalk', { km: venue.distanceKm, min: venue.walkingMinutes })}
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
            {expanded ? t('events.allUpcoming') : t('events.nextHours')}
          </h4>
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-lg border border-bo-neutral-200/50 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900"
              >
                {event.imageUrl && (
                  <div className="relative h-28 w-full">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <div className="text-sm font-semibold text-white leading-tight">{event.title}</div>
                      <div className="text-xs text-white/80">{event.venueName}</div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  {/* Header — hidden when image already shows title in overlay */}
                  {!event.imageUrl && (
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
                          {t('events.ticketsAvailable')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tickets badge for image cards (header is in overlay) */}
                  {event.imageUrl && event.ticketsAvailable && (
                    <div className="mb-2 flex justify-end">
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">
                        <Ticket className="h-3 w-3" />
                        {t('events.ticketsAvailable')}
                      </span>
                    </div>
                  )}

                  {event.description && (
                    <div className="mb-2 text-sm text-bo-neutral-600">{event.description}</div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-bo-neutral-700">
                      <Clock className="h-4 w-4 text-bo-info-dark" />
                      <div>
                        <div className="font-medium">{formatDate(event.startTime)}</div>
                        <div className="text-xs text-bo-neutral-500">{formatTime(event.startTime)} · {formatHoursUntil(event.startTime)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-bo-neutral-700">
                      <MapPin className="h-4 w-4 text-bo-info-dark" />
                      <div>
                        <div className="font-medium">{t('events.awayKm', { km: event.venue.distanceKm })}</div>
                        <div className="text-xs text-bo-neutral-500">{t('events.minWalk', { min: event.venue.walkingMinutes })}</div>
                      </div>
                    </div>

                    {event.estimatedAttendance && (
                      <div className="flex items-center gap-2 text-bo-neutral-700">
                        <Users className="h-4 w-4 text-bo-info-dark" />
                        <div>
                          <div className="font-medium">
                            {t('events.expectedCount', { count: event.estimatedAttendance.toLocaleString() })}
                          </div>
                          <div className="text-xs text-bo-neutral-500">{t('events.attendanceLabel')}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-bo-neutral-700">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium text-green-600">+{event.footfallImpact} {t('events.visitorsUnit')}</div>
                        <div className="text-xs text-bo-neutral-500">{t('events.footfallImpactLabel')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-bo-neutral-500">{t('events.sourceLabel')} {event.source}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-bo-neutral-200/50 bg-white/80 p-6 text-center dark:bg-slate-800/50">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-bo-neutral-400" />
          <div className="text-sm text-bo-neutral-600">
            {expanded ? t('events.noUpcoming') : t('events.noEventsNextHours')}
          </div>
        </div>
      )}

      {eventsData && (
        <div className="mt-4 text-xs text-bo-neutral-500">
          {t('events.updatedShowingNext30', {
            date: new Date(eventsData.timestamp).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
        </div>
      )}

      {expanded && (
        <div className="mt-6 space-y-4 border-t border-bo-neutral-200/50 pt-4">
          <h4 className="font-semibold text-bo-neutral-950">{t('events.impactAnalysis')}</h4>
          <div className="text-sm text-bo-neutral-700">
            {t('events.impactDescription')}
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="text-sm font-medium text-bo-neutral-950">{t('events.impactModel')}</div>
            <div className="mt-2 space-y-1 text-xs text-bo-neutral-600">
              <div>• {t('events.impactFactor1')}</div>
              <div>• {t('events.impactFactor2')}</div>
              <div>• {t('events.impactFactor3')}</div>
              <div>• {t('events.impactFactor4')}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
