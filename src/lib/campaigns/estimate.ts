import { getTenantCampaignSeed } from '@/lib/shoppermind/tenantImpact';
import { CAMPAIGN_LABELS, interpolate, lang } from './labels';
import {
  SELLO_ANNUAL_SALES_EUR,
  SELLO_ANNUAL_VISITORS,
  type CampaignEstimate,
  type CampaignSelection,
} from './types';

const CATEGORY_LIFT: Record<string, [number, number]> = {
  'food-beverage': [4.1, 2.2],
  'beauty-health': [2.4, 3.4],
  services: [1.8, 1.5],
  'fashion-apparel': [2.7, 3.8],
  'grocery-daily': [3.6, 1.4],
  'home-furniture': [1.5, 2.8],
  electronics: [1.7, 3.1],
};

const ZONE_LIFT: Record<string, number> = {
  everyday: 0.25,
  station: 0.7,
  restaurants: 0.45,
  services: 0.3,
  fashion: 0.28,
  home: 0.18,
};

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} %`;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function tenantTarget(selected: number, available: number, budget: string) {
  if (selected) return selected;
  const max = budget === 'light' ? 4 : budget === 'broad' ? 10 : 7;
  return Math.min(available, max);
}

export function estimateCampaign(selection: CampaignSelection, language?: string | null): CampaignEstimate {
  const seed = getTenantCampaignSeed(selection.mallId, language);
  const available = seed.stores.filter((store) => store.categoryIds?.includes(selection.category)).length;
  const tenants = tenantTarget(selection.stores.length, available, selection.budget);
  const [visitBase, salesBase] = CATEGORY_LIFT[selection.category] ?? [2.2, 2.1];
  const budget = { light: 0.72, standard: 1, broad: 1.32 }[selection.budget] ?? 1;
  const duration = { '7': 0.72, '14': 1, '30': 1.22 }[selection.duration] ?? 1;
  const visits = round1((visitBase + (ZONE_LIFT[selection.zone] ?? 0) + tenants * 0.08) * budget * duration);
  const sales = round1((salesBase + tenants * 0.12) * (0.85 + budget * 0.18) * duration);
  const L = CAMPAIGN_LABELS[lang(language)];

  return {
    baseline: { annualVisitors: SELLO_ANNUAL_VISITORS, annualSalesEur: SELLO_ANNUAL_SALES_EUR },
    metrics: {
      visits: { value: signed(visits), trend: visits, hint: interpolate(L.visitHint, { days: selection.duration, tenants }) },
      sales: { value: signed(sales), trend: sales, hint: L.salesHint },
      tenants: { value: String(tenants), trend: selection.stores.length ? 2.4 : 0.8, hint: interpolate(L.tenantHint, { selected: selection.stores.length, available }) },
    },
  };
}
