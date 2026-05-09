export const VENUE_OPERATOR_DEMO = {
  customerId: 'demo-venue-operator',
  name: 'Nordic Live Venues Oy',
  venues: [
    {
      venueId: 'venue-fi-nokia-arena',
      name: 'Nokia Arena',
      city: 'Tampere',
      country: 'FI',
      capacity: 15000,
      annualVisitors: 1000000,
      annualEvents: 140,
      zones: [
        ['north-gate', 'North Gate', 'arrival', 4200, true],
        ['main-bowl', 'Main Bowl', 'bowl', 15000, true],
        ['skybox-ring', 'Skybox Ring', 'hospitality', 900, false],
      ],
    },
    {
      venueId: 'venue-ae-etihad-arena',
      name: 'Etihad Arena',
      city: 'Abu Dhabi',
      country: 'AE',
      capacity: 18000,
      annualVisitors: undefined,
      annualEvents: 80,
      zones: [
        ['yas-arrival', 'Yas Bay Arrival', 'arrival', 6500, true],
        ['main-bowl', 'Main Bowl', 'bowl', 18000, true],
        ['vip-suites', 'VIP Suites', 'hospitality', 1200, false],
      ],
    },
    {
      venueId: 'venue-sg-national-stadium',
      name: 'Singapore National Stadium',
      city: 'Singapore',
      country: 'SG',
      capacity: 55000,
      annualVisitors: undefined,
      annualEvents: 55,
      zones: [
        ['mrt-arrival', 'MRT Arrival Spine', 'transport', 18000, true],
        ['lower-bowl', 'Lower Bowl', 'bowl', 30000, true],
        ['concourse-loop', 'Concourse Loop', 'concourse', 22000, true],
      ],
    },
  ],
} as const;
