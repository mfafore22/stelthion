import { VENUE_MIND_DEMOS } from './demoData.js';
import type { VenueMindDemo } from './types.js';

export function listVenueMindDemos(): VenueMindDemo[] {
  return VENUE_MIND_DEMOS;
}

export function getVenueMindDemo(id?: string | null): VenueMindDemo {
  return VENUE_MIND_DEMOS.find((venue) => venue.id === id) ?? VENUE_MIND_DEMOS[0];
}

export function buildVenueMindSignal(venue: VenueMindDemo): string {
  const peak = venue.events.reduce((best, event) =>
    event.expectedGuests > best.expectedGuests ? event : best, venue.events[0]);
  return [
    `${venue.name} should treat the next high-attendance event as a whole-venue operating product.`,
    `The main risk is not only crowd size, but the sequence from arrival to concessions, seating, egress, and sponsor exposure.`,
    `Focus live data on ${peak.title}: arrival curves, concourse dwell, premium uptake, queue friction, and post-event transport release.`,
  ].join(' ');
}

export function buildVenueBrief(venue: VenueMindDemo): string {
  const event = venue.events[0];
  return [
    `Venue: ${venue.name}, ${venue.city}`,
    `Next demo event: ${event.title}, expected guests ${event.expectedGuests.toLocaleString('en-US')}`,
    `Operational focus: ${event.note}`,
    `Recommended loop: forecast demand, brief zone owners, monitor live curves, adjust concessions, then capture learnings for the next event.`,
  ].join('\n');
}
