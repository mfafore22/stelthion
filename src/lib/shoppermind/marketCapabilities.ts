import { getMall } from '@/lib/mall/mallDatabase';

export type ShopperMindMarketRole = 'operating' | 'benchmark';

export interface ShopperMindMarketCapabilities {
  role: ShopperMindMarketRole;
  actionsEnabled: boolean;
  decisionSupportEnabled: boolean;
  propertySelectorsEnabled: boolean;
}

export function getOperatingCountries(propertyIds: string[] | null | undefined): Set<string> {
  const countries = new Set<string>();
  for (const propertyId of propertyIds ?? []) {
    const country = getMall(propertyId)?.country;
    if (country) countries.add(country);
  }
  return countries;
}

export function getShopperMindMarketCapabilities(
  country: string,
  operatingCountries: Set<string>,
): ShopperMindMarketCapabilities {
  const isOperatingMarket = operatingCountries.has(country.toUpperCase());
  return {
    role: isOperatingMarket ? 'operating' : 'benchmark',
    actionsEnabled: isOperatingMarket,
    decisionSupportEnabled: isOperatingMarket,
    propertySelectorsEnabled: isOperatingMarket,
  };
}
