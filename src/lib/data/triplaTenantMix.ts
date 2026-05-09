import data from '../../../data/tripla/tenant-mix.json';

export type TriplaFloorId = 'unknown' | 'p1' | 'floor1' | 'floor2' | 'floor3' | 'floor4';

export interface TriplaTenant {
  name: string;
  category: string;
  floor: TriplaFloorId;
  location: string;
  url: string;
}

export const TRIPLA_TENANTS = data.tenants as TriplaTenant[];
export const TRIPLA_TENANT_SOURCE_URLS = data.sourceUrls;
export const TRIPLA_TENANT_UPDATED_AT = data.updatedAt;

function countBy(items: TriplaTenant[], key: keyof TriplaTenant) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item[key]] = (acc[item[key]] ?? 0) + 1;
    return acc;
  }, {});
}

export function getTriplaTenantSummary() {
  const categoryCounts = countBy(TRIPLA_TENANTS, 'category');
  const total = TRIPLA_TENANTS.length || 1;
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count, percentage: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
  return {
    totalShops: TRIPLA_TENANTS.length,
    categoryCounts,
    retailerPercentages: Object.fromEntries(
      topCategories.map((c) => [c.category, c.percentage]),
    ),
    topCategories,
  };
}
