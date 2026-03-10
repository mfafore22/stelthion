/**
 * Ideapark Lempäälä — Upcoming events from nearby venues (~25 km radius)
 *
 * Venues:
 *   - Nokia Arena (Tampere, 22 km) — 22 000-seat arena
 *   - Tampere-talo (22 km) — concert & congress centre
 *   - Tampereen Messu ja Urheilu (21 km) — exhibition centre
 *
 * Static data used until Tampere Linked Events API integration is added.
 * Dates are calculated dynamically from today.
 */

import type { EventsData, VenueInfo, VenueEvent } from '@/lib/types/events';

const ideaparkVenues: VenueInfo[] = [
  {
    name: 'Nokia Arena',
    distanceKm: 22,
    walkingMinutes: 0,
    type: 'arena',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
  },
  {
    name: 'Tampere-talo',
    distanceKm: 22,
    walkingMinutes: 0,
    type: 'concert-hall',
    imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=400&fit=crop',
  },
  {
    name: 'Tampereen Messu ja Urheilu',
    distanceKm: 21,
    walkingMinutes: 0,
    type: 'exhibition-center',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
  },
];

export function getIdeaparkUpcomingEvents(): EventsData {
  const today = new Date();

  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const events: VenueEvent[] = [
    // Nokia Arena — ice hockey
    {
      id: 'na-tappara-ilves',
      title: 'Tappara vs Ilves — Liiga',
      venue: 'Nokia Arena',
      startDate: addDays(today, 2),
      startTime: '18:30',
      endTime: '21:00',
      category: 'sports',
      expectedAttendance: 15000,
      description: 'Tampereen klassinen derby — Suomen huippujääkiekkoseurojen välinen kamppailu',
    },
    {
      id: 'na-concert-1',
      title: 'Nightwish — Decades World Tour',
      venue: 'Nokia Arena',
      startDate: addDays(today, 7),
      startTime: '19:00',
      endTime: '22:30',
      category: 'concert',
      expectedAttendance: 19000,
      description: 'Suomalaisen sinfonisen metallin legendat eurooppalaisella areenaturnéellaan',
    },
    {
      id: 'na-tappara-karpat',
      title: 'Tappara vs Kärpät — Liiga',
      venue: 'Nokia Arena',
      startDate: addDays(today, 12),
      startTime: '18:30',
      endTime: '21:00',
      category: 'sports',
      expectedAttendance: 14200,
      description: 'Suomen Liigan kärkijoukkueiden kohtaaminen',
    },
    {
      id: 'na-concert-2',
      title: 'Sunrise Avenue — Farewell Tour',
      venue: 'Nokia Arena',
      startDate: addDays(today, 19),
      startTime: '19:30',
      endTime: '23:00',
      category: 'concert',
      expectedAttendance: 16000,
      description: 'Suomalaisen pop-rock-yhtyeen jäähyväiskonsertti areenalla',
    },
    {
      id: 'na-ilves-lukko',
      title: 'Ilves vs Lukko — Liiga',
      venue: 'Nokia Arena',
      startDate: addDays(today, 26),
      startTime: '17:00',
      endTime: '19:30',
      category: 'sports',
      expectedAttendance: 11500,
      description: 'Suomen Liigan lauantaimatinea',
    },

    // Tampere-talo — classical & theatre
    {
      id: 'th-tampere-philharmonic',
      title: 'Tampere Filharmonikot — Sibelius-gaala',
      venue: 'Tampere-talo',
      startDate: addDays(today, 4),
      startTime: '19:00',
      endTime: '21:30',
      category: 'concert',
      expectedAttendance: 1800,
      description: 'Tampere Filharmonikot esittää Jean Sibeliuksen sinfonioita',
    },
    {
      id: 'th-stand-up',
      title: 'Pirkanmaan Stand-Up -festivaali',
      venue: 'Tampere-talo',
      startDate: addDays(today, 10),
      endDate: addDays(today, 11),
      startTime: '19:00',
      endTime: '22:00',
      category: 'festival',
      expectedAttendance: 3200,
      description: 'Suomen huippustand-up-koomikot kahden illan ohjelmassa',
    },
    {
      id: 'th-chamber-music',
      title: 'Pohjoismainen Kamarimusiikkifestivaali',
      venue: 'Tampere-talo',
      startDate: addDays(today, 22),
      endDate: addDays(today, 24),
      startTime: '18:00',
      endTime: '21:00',
      category: 'concert',
      expectedAttendance: 950,
      description: 'Vuotuinen kamarimusiikkifestivaali pohjoismaisilla yhtyeillä',
    },

    // Tampereen Messu ja Urheilu
    {
      id: 'tesc-koti-ja-asuminen',
      title: 'Koti & Asuminen — Tampere',
      venue: 'Tampereen Messu ja Urheilu',
      startDate: addDays(today, 5),
      endDate: addDays(today, 7),
      startTime: '10:00',
      endTime: '18:00',
      category: 'exhibition',
      expectedAttendance: 22000,
      description: 'Pirkanmaan suurin sisustus-, huonekalu- ja kodinparannusmessut',
    },
    {
      id: 'tesc-auto-tampere',
      title: 'Tampere Auto Show',
      venue: 'Tampereen Messu ja Urheilu',
      startDate: addDays(today, 16),
      endDate: addDays(today, 18),
      startTime: '10:00',
      endTime: '19:00',
      category: 'exhibition',
      expectedAttendance: 35000,
      description: 'Uudet mallit ja konseptiautot johtavilta autovalmistajilta',
    },
    {
      id: 'tesc-eramessut',
      title: 'Erämessut — Kalastus ja Metsästys',
      venue: 'Tampereen Messu ja Urheilu',
      startDate: addDays(today, 28),
      endDate: addDays(today, 30),
      startTime: '10:00',
      endTime: '18:00',
      category: 'exhibition',
      expectedAttendance: 18000,
      description: 'Suomen johtavat ulkoilu-, kalastus- ja metsästysmessut',
    },
  ];

  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  return {
    mallId: 'ideapark',
    venues: ideaparkVenues,
    upcomingEvents: events,
    dataSource: 'Nokia Arena (nokiaarena.fi), Tampere-talo (tampere-talo.fi), Tampereen Messu ja Urheilu — static schedule',
    lastUpdated: new Date().toISOString(),
  };
}
