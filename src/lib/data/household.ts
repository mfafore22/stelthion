/**
 * Household statistics for Ideapark Lempäälä catchment area
 * Source: Statistics Finland (Tilastokeskus) — Lempäälä & surroundings, 2023
 */

import type { MallHouseholdData } from '@/lib/types/household';

const IDEAPARK_HOUSEHOLDS: MallHouseholdData = {
  dataSource: 'Statistics Finland (Tilastokeskus) · Ideapark catchment 2023',
  summary: {
    totalHouseholds: 48_320,
    averageHouseholdSize: 2.41,
    ownershipRate: 68.4,
    predominantType: 'family-suburban',
  },
  catchmentAreas: [
    {
      postalCode: '37550',
      area: 'Lempäälä keskusta',
      averageHouseholdSize: 2.38,
      households: {
        total: 5_820,
        onePerson: 1_690,
        twoPerson: 1_940,
        threePerson: 1_120,
        fourPerson: 780,
        fivePlusPerson: 290,
      },
      ownership: { owned: 3_980, rented: 1_840, ownershipRate: 68.4 },
    },
    {
      postalCode: '37530',
      area: 'Sääksjärvi',
      averageHouseholdSize: 2.62,
      households: {
        total: 7_140,
        onePerson: 1_570,
        twoPerson: 2_210,
        threePerson: 1_780,
        fourPerson: 1_210,
        fivePlusPerson: 370,
      },
      ownership: { owned: 5_260, rented: 1_880, ownershipRate: 73.7 },
    },
    {
      postalCode: '37510',
      area: 'Kulju',
      averageHouseholdSize: 2.55,
      households: {
        total: 4_980,
        onePerson: 1_180,
        twoPerson: 1_550,
        threePerson: 1_230,
        fourPerson: 780,
        fivePlusPerson: 240,
      },
      ownership: { owned: 3_560, rented: 1_420, ownershipRate: 71.5 },
    },
    {
      postalCode: '37560',
      area: 'Ideapark / Marjamäki',
      averageHouseholdSize: 2.71,
      households: {
        total: 3_210,
        onePerson: 590,
        twoPerson: 940,
        threePerson: 890,
        fourPerson: 610,
        fivePlusPerson: 180,
      },
      ownership: { owned: 2_480, rented: 730, ownershipRate: 77.3 },
    },
    {
      postalCode: '33960',
      area: 'Pirkkala',
      averageHouseholdSize: 2.58,
      households: {
        total: 8_640,
        onePerson: 2_010,
        twoPerson: 2_680,
        threePerson: 2_110,
        fourPerson: 1_420,
        fivePlusPerson: 420,
      },
      ownership: { owned: 6_110, rented: 2_530, ownershipRate: 70.7 },
    },
    {
      postalCode: '37200',
      area: 'Valkeakoski',
      averageHouseholdSize: 2.18,
      households: {
        total: 9_820,
        onePerson: 3_140,
        twoPerson: 3_390,
        threePerson: 1_890,
        fourPerson: 1_020,
        fivePlusPerson: 380,
      },
      ownership: { owned: 6_140, rented: 3_680, ownershipRate: 62.5 },
    },
    {
      postalCode: '33800',
      area: 'Tampere etelä',
      averageHouseholdSize: 1.98,
      households: {
        total: 8_710,
        onePerson: 3_820,
        twoPerson: 2_660,
        threePerson: 1_330,
        fourPerson: 720,
        fivePlusPerson: 180,
      },
      ownership: { owned: 4_640, rented: 4_070, ownershipRate: 53.3 },
    },
  ],
};

export function getHouseholdData(): MallHouseholdData {
  return IDEAPARK_HOUSEHOLDS;
}
