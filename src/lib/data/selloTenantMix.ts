import data from '../../../data/sello/tenant-mix.json';

export type SelloFloorId = 'p1' | 'floor1' | 'floor2' | 'floor3' | 'floor4';

export interface SelloTenant {
  name: string;
  category: string;
  floor: SelloFloorId;
  location: string;
  url: string;
}

export const SELLO_TENANTS = data.tenants as SelloTenant[];
export const SELLO_TENANT_SOURCE_URLS = data.sourceUrls;
export const SELLO_TENANT_UPDATED_AT = data.updatedAt;

export const SELLO_FLOOR_LABELS: Record<SelloFloorId, string> = {
  p1: 'P1',
  floor1: '1',
  floor2: '2',
  floor3: '3',
  floor4: '4',
};

function countBy(items: SelloTenant[], key: keyof SelloTenant) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item[key]] = (acc[item[key]] ?? 0) + 1;
    return acc;
  }, {});
}

export function getSelloTenantSummary() {
  const categoryCounts = countBy(SELLO_TENANTS, 'category');
  const floorCounts = countBy(SELLO_TENANTS, 'floor');
  const total = SELLO_TENANTS.length || 1;
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count, percentage: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
  return {
    totalShops: SELLO_TENANTS.length,
    categoryCounts,
    floorCounts,
    retailerPercentages: Object.fromEntries(topCategories.map((c) => [c.category, c.percentage])),
    topCategories,
  };
}

export function getSelloTenantsByFloor() {
  return (Object.keys(SELLO_FLOOR_LABELS) as SelloFloorId[]).map((floor) => ({
    floor,
    label: SELLO_FLOOR_LABELS[floor],
    tenants: SELLO_TENANTS.filter((tenant) => tenant.floor === floor),
  }));
}
