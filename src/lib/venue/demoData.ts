import type { VenueDemo } from './types';

export const VENUE_DEMOS: VenueDemo[] = [
  {
    id: 'venue-fi-nokia-arena',
    name: 'Nokia Arena',
    city: 'Tampere',
    country: 'FI',
    capacity: 15000,
    annualVisitors: 1000000,
    annualEvents: 140,
    theme: { primary: '#214990', secondary: '#328d2e', accent: '#c7b88a' },
    events: [
      { id: 'fi-1', title: 'EuroVolley 2026', category: 'sport', date: '2026-09-10', expectedGuests: 14200, note: 'Multi-day visitor curve with hotel, rail, and fan-zone demand.' },
      { id: 'fi-2', title: 'Deep Purple', category: 'concert', date: '2026-10-04', expectedGuests: 12800, note: 'Late-evening egress pressure and premium hospitality uplift.' },
    ],
    zones: [
      { id: 'north-gate', name: 'North Gate', category: 'arrival', capacity: 4200, sensorReady: true },
      { id: 'main-bowl', name: 'Main Bowl', category: 'bowl', capacity: 15000, sensorReady: true },
      { id: 'skybox-ring', name: 'Skybox Ring', category: 'hospitality', capacity: 900, sensorReady: false },
    ],
  },
  {
    id: 'venue-ae-etihad-arena',
    name: 'Etihad Arena',
    city: 'Abu Dhabi',
    country: 'AE',
    capacity: 18000,
    annualEvents: 80,
    theme: { primary: '#0f766e', secondary: '#214990', accent: '#e6b35a' },
    events: [
      { id: 'ae-1', title: 'CATS', category: 'family', date: '2026-05-07', expectedGuests: 9200, note: 'Family arrivals, early F&B peaks, and taxi queuing matter most.' },
      { id: 'ae-2', title: 'Muse', category: 'concert', date: '2026-06-18', expectedGuests: 16500, note: 'High international mix with hotel and Yas Bay spillover.' },
    ],
    zones: [
      { id: 'yas-arrival', name: 'Yas Bay Arrival', category: 'arrival', capacity: 6500, sensorReady: true },
      { id: 'main-bowl', name: 'Main Bowl', category: 'bowl', capacity: 18000, sensorReady: true },
      { id: 'vip-suites', name: 'VIP Suites', category: 'hospitality', capacity: 1200, sensorReady: false },
    ],
  },
  {
    id: 'venue-sg-national-stadium',
    name: 'Singapore National Stadium',
    city: 'Singapore',
    country: 'SG',
    capacity: 55000,
    annualEvents: 55,
    theme: { primary: '#b91c1c', secondary: '#214990', accent: '#c7b88a' },
    events: [
      { id: 'sg-1', title: 'BLACKPINK', category: 'concert', date: '2026-08-01', expectedGuests: 52000, note: 'Merch, weather sheltering, and station egress are the commercial levers.' },
      { id: 'sg-2', title: 'HSBC SVNS', category: 'sport', date: '2026-04-11', expectedGuests: 45000, note: 'Tournament dwell time creates sponsor and F&B daypart opportunities.' },
    ],
    zones: [
      { id: 'mrt-arrival', name: 'MRT Arrival Spine', category: 'transport', capacity: 18000, sensorReady: true },
      { id: 'lower-bowl', name: 'Lower Bowl', category: 'bowl', capacity: 30000, sensorReady: true },
      { id: 'concourse-loop', name: 'Concourse Loop', category: 'concourse', capacity: 22000, sensorReady: true },
    ],
  },
];

export function getVenueDemo(id?: string | null) {
  return VENUE_DEMOS.find((venue) => venue.id === id) ?? VENUE_DEMOS[0];
}
