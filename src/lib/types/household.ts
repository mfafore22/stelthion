/** Household statistics types for catchment area analysis */

export interface HouseholdData {
  postalCode: string;
  area: string;
  averageHouseholdSize: number;
  households: {
    total: number;
    onePerson: number;
    twoPerson: number;
    threePerson: number;
    fourPerson: number;
    fivePlusPerson: number;
  };
  ownership: {
    owned: number;
    rented: number;
    ownershipRate: number;
  };
}

export interface MallHouseholdData {
  dataSource: string;
  summary: {
    totalHouseholds: number;
    averageHouseholdSize: number;
    ownershipRate: number;
    predominantType: string;
  };
  catchmentAreas: HouseholdData[];
}
