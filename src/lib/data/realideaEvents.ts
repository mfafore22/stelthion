import type { EventsData, VenueEvent, VenueInfo } from '@/lib/types/events';
import type { RealideaLocationMallId } from './realideaTransport';

const images = {
  concert: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=400&fit=crop',
  arena: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=800&h=400&fit=crop',
  expo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
};

const venues: Record<RealideaLocationMallId, VenueInfo[]> = {
  'realidea-sello': [
    { id: 'sellosali', name: 'Sellosali', distanceKm: 0.1, walkingMinutes: 2, type: 'concert-hall', imageUrl: images.concert },
    { id: 'vermo', name: 'Vermo Areena', distanceKm: 2.3, walkingMinutes: 28, type: 'arena', imageUrl: images.arena },
    { id: 'metro-areena', name: 'Espoo Metro Areena', distanceKm: 7.5, walkingMinutes: 90, type: 'arena', imageUrl: images.arena },
  ],
  'realidea-tripla': [
    { id: 'messukeskus', name: 'Messukeskus Helsinki', distanceKm: 0.7, walkingMinutes: 9, type: 'exhibition-center', imageUrl: images.expo },
    { id: 'helsinki-ice-hall', name: 'Helsingin jäähalli', distanceKm: 2.0, walkingMinutes: 25, type: 'arena', imageUrl: images.arena },
    { id: 'olympic-stadium', name: 'Olympiastadion', distanceKm: 2.7, walkingMinutes: 35, type: 'stadium', imageUrl: images.arena },
  ],
};

const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

function event(id: string, title: string, venueName: string, days: number, category: VenueEvent['category'], expectedAttendance: number): VenueEvent {
  return {
    id,
    title,
    venue: venueName,
    startDate: addDays(new Date(), days),
    startTime: category === 'exhibition' ? '10:00' : '19:00',
    endTime: category === 'exhibition' ? '18:00' : '22:00',
    category,
    expectedAttendance,
  };
}

const eventFactories: Record<RealideaLocationMallId, () => VenueEvent[]> = {
  'realidea-sello': () => [
    event('sello-jazz-ilta', 'Sellosali Jazz-ilta', 'Sellosali', 3, 'concert', 380),
    event('vermo-ravit', 'Vermo keskiviikkoravit', 'Vermo Areena', 5, 'sports', 2400),
    event('sello-perhepaiva', 'Leppävaaran perhepäivä', 'Sellosali', 9, 'festival', 900),
    event('metro-esport', 'Kiekko-Espoo kotiottelu', 'Espoo Metro Areena', 12, 'sports', 5200),
    event('vermo-design', 'Vermo Design & Lifestyle', 'Vermo Areena', 18, 'exhibition', 8500),
  ],
  'realidea-tripla': () => [
    event('messukeskus-matkailu', 'Matka- ja elämysmessut', 'Messukeskus Helsinki', 2, 'exhibition', 42000),
    event('tripla-biz', 'Pasila Business Forum', 'Messukeskus Helsinki', 7, 'conference', 5200),
    event('hifk-home', 'HIFK kotiottelu', 'Helsingin jäähalli', 10, 'sports', 7800),
    event('stadium-concert', 'Stadionin kesäkonsertti', 'Olympiastadion', 17, 'concert', 36000),
    event('messukeskus-habitare', 'Habitare Helsinki', 'Messukeskus Helsinki', 24, 'exhibition', 56000),
  ],
};

export function getRealideaUpcomingEvents(mallId: string): EventsData | null {
  const id = mallId as RealideaLocationMallId;
  if (!venues[id]) return null;
  const upcomingEvents = eventFactories[id]().sort((a, b) => a.startDate.localeCompare(b.startDate));
  return {
    mallId: id,
    venues: venues[id],
    upcomingEvents,
    dataSource: 'Stelthion Realidea location context; ready for Linked Events integration',
    lastUpdated: new Date().toISOString(),
  };
}
