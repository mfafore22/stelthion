import { NextRequest } from 'next/server';
import { resolveScopedVenue } from '@/lib/customer-scope/requireVenueScope';
import { getVenueDemo } from '@/lib/venue/demoData';
import { buildVenueSignal } from '@/lib/venue/insights';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const venueId = String(body.venueId || '');
  const message = String(body.message || '');
  if (!venueId || !message) {
    return new Response(JSON.stringify({ error: 'venueId and message required' }), { status: 400 });
  }
  const scope = await resolveScopedVenue(venueId);
  if (scope.error) return scope.error;

  const venue = getVenueDemo(venueId);
  const venueName = venue.id === venueId ? venue.name : scope.venue!.name;
  const signal = venue.id === venueId
    ? buildVenueSignal(venue)
    : `${venueName} can connect event calendar, crowd flow, commercial and safety data into VenueMind.`;
  const content = venueResponse(venueName, message, signal);
  return new Response(toSse(content, venueId), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
    },
  });
}

function venueResponse(venueName: string, message: string, signal: string) {
  return [
    `For ${venueName}, I would handle this inside VenueMind rather than mall ShopperMind.`,
    '',
    `Current signal: ${signal}`,
    '',
    'Next useful action:',
    '1. Select the next event and lock expected attendance, audience mix, and arrival windows.',
    '2. Assign owners for arrival, concourse, bowl, hospitality, safety, and egress.',
    '3. Attach live feeds when ready: ticket scans, counters, POS, weather, transport, incidents, and sponsor exposure.',
    '',
    `Your prompt was scoped to this venue only: ${message}`,
  ].join('\n');
}

function toSse(content: string, venueId: string) {
  const events = [
    { type: 'conversation', data: { conversationId: `venue-${Date.now()}` } },
    { type: 'message_start', data: { agentRole: 'venue-assistant', venueId } },
    { type: 'message_chunk', data: { text: content } },
    { type: 'message_complete', data: { content, agentRole: 'venue-assistant' } },
  ];
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');
}
