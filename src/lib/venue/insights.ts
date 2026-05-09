import type { VenueDemo } from './types';

export function buildVenueSignal(venue: VenueDemo): string {
  const peak = venue.events.reduce((best, event) =>
    event.expectedGuests > best.expectedGuests ? event : best, venue.events[0]);
  return [
    `${venue.name} should treat the next high-attendance event as a whole-venue operating product.`,
    'The main risk is not only crowd size, but the sequence from arrival to concessions, seating, egress, and sponsor exposure.',
    `Focus live data on ${peak.title}: arrival curves, concourse dwell, premium uptake, queue friction, and transport release.`,
  ].join(' ');
}

export function venueOpportunityRows(venue: VenueDemo) {
  return [
    { label: 'Arrival', value: 'Predict gate pressure 90 minutes before doors and rebalance stewards.' },
    { label: 'Commercial', value: 'Move offers by event type, dwell zone, and guest intent instead of one generic sponsor pack.' },
    { label: 'Experience', value: `Use ${venue.zones[0].name} as the first monitored friction point for fan satisfaction.` },
  ];
}
