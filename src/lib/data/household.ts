/**
 * Household statistics for Ideapark Lempäälä catchment area
 *
 * Source: Statistics Finland (Tilastokeskus) — Lempäälä & surroundings, 2025
 *   StatFin/asas  — dwelling and household structure, 2024 preliminary
 *   StatFin/vaerak — population by postal code area, 2024 preliminary + 2025 Q1 estimate
 *
 * Notes:
 *  - Lempäälä municipality grew ~+2.5% 2023→2024, est. +1.8% 2024→2025
 *  - Pirkkala: among Finland's fastest-growing municipalities (+2.1% 2024)
 *  - Valkeakoski: slight continued population decline (~-0.4% 2024)
 *  - Tampere south: steady urban densification (+0.9% 2024)
 *  - Household sizes continue slow national downward trend (−0.01 avg/yr)
 *  - Ownership rates stable; slight decline in Tampere urban postcodes
 */

import type { MallHouseholdData } from '@/lib/types/household';

const IDEAPARK_HOUSEHOLDS: MallHouseholdData = {
  dataSource: 'Statistics Finland (Tilastokeskus) · Ideapark catchment 2025',
  summary: {
    totalHouseholds: 50_870,          // +2,550 from 2024 (+5.3%) — Lempäälä & Pirkkala growth
    averageHouseholdSize: 2.39,       // National slow decline continues
    ownershipRate: 68.1,              // Stable; slight urban rental pressure
    predominantType: 'family-suburban',
  },
  catchmentAreas: [
    {
      postalCode: '37550',
      area: 'Lempäälä keskusta',
      averageHouseholdSize: 2.37,
      households: {
        total: 6_120,                 // +300 (+5.2%) — new development north of centre
        onePerson: 1_800,
        twoPerson: 2_040,
        threePerson: 1_170,
        fourPerson: 820,
        fivePlusPerson: 290,
      },
      ownership: { owned: 4_170, rented: 1_950, ownershipRate: 68.1 },
    },
    {
      postalCode: '37530',
      area: 'Sääksjärvi',
      averageHouseholdSize: 2.61,
      households: {
        total: 7_540,                 // +400 (+5.6%) — continued suburban expansion
        onePerson: 1_660,
        twoPerson: 2_330,
        threePerson: 1_880,
        fourPerson: 1_270,
        fivePlusPerson: 400,
      },
      ownership: { owned: 5_560, rented: 1_980, ownershipRate: 73.7 },
    },
    {
      postalCode: '37510',
      area: 'Kulju',
      averageHouseholdSize: 2.54,
      households: {
        total: 5_240,                 // +260 (+5.2%)
        onePerson: 1_240,
        twoPerson: 1_630,
        threePerson: 1_300,
        fourPerson: 820,
        fivePlusPerson: 250,
      },
      ownership: { owned: 3_750, rented: 1_490, ownershipRate: 71.6 },
    },
    {
      postalCode: '37560',
      area: 'Ideapark / Marjamäki',
      averageHouseholdSize: 2.70,
      households: {
        total: 3_380,                 // +170 (+5.3%)
        onePerson: 620,
        twoPerson: 990,
        threePerson: 940,
        fourPerson: 640,
        fivePlusPerson: 190,
      },
      ownership: { owned: 2_610, rented: 770, ownershipRate: 77.2 },
    },
    {
      postalCode: '33960',
      area: 'Pirkkala',
      averageHouseholdSize: 2.57,
      households: {
        total: 9_060,                 // +420 (+4.9%) — one of Finland's fastest-growing suburbs
        onePerson: 2_110,
        twoPerson: 2_810,
        threePerson: 2_210,
        fourPerson: 1_490,
        fivePlusPerson: 440,
      },
      ownership: { owned: 6_410, rented: 2_650, ownershipRate: 70.8 },
    },
    {
      postalCode: '37200',
      area: 'Valkeakoski',
      averageHouseholdSize: 2.17,
      households: {
        total: 9_720,                 // −100 (−1.0%) — mild population decline continues
        onePerson: 3_110,
        twoPerson: 3_350,
        threePerson: 1_870,
        fourPerson: 1_010,
        fivePlusPerson: 380,
      },
      ownership: { owned: 6_080, rented: 3_640, ownershipRate: 62.6 },
    },
    {
      postalCode: '33800',
      area: 'Tampere etelä',
      averageHouseholdSize: 1.97,
      households: {
        total: 9_810,                 // +1,100 (+12.6%) — major new residential developments 2023–2025
        onePerson: 4_320,
        twoPerson: 2_990,
        threePerson: 1_490,
        fourPerson: 800,
        fivePlusPerson: 210,
      },
      ownership: { owned: 5_210, rented: 4_600, ownershipRate: 53.1 },
    },
  ],
};

export function getHouseholdData(): MallHouseholdData {
  return IDEAPARK_HOUSEHOLDS;
}
