export type CampaignBudget = 'light' | 'standard' | 'broad';
export type CampaignDuration = '7' | '14' | '30';
export type CampaignLang = 'fi' | 'en' | 'sv';

export interface CampaignSelection {
  mallId: string;
  zone: string;
  audience: string;
  category: string;
  stores: string[];
  budget: CampaignBudget;
  duration: CampaignDuration;
  impact?: string;
}

export interface CampaignMetric {
  value: string;
  trend: number;
  hint: string;
}

export interface CampaignEstimate {
  baseline: { annualVisitors: number; annualSalesEur: number };
  metrics: Record<'visits' | 'sales' | 'tenants', CampaignMetric>;
}

export const SELLO_ANNUAL_VISITORS = 24_000_000;
export const SELLO_ANNUAL_SALES_EUR = 720_000_000;
