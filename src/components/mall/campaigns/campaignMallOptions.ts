import { MALLS } from '@/lib/mall/mallDatabase';

export interface CampaignMallOption {
  id: string;
  name: string;
  enabled: boolean;
}

const ENABLED_MALLS = new Set(['realidea-sello', 'realidea-tripla']);
const REALIDEA_PROPERTIES = [
  'realidea-sello',
  'realidea-tripla',
  'realidea-kamp-galleria',
  'realidea-karuselli',
  'realidea-plaza',
  'realidea-arabia',
  'realidea-columbus',
  'realidea-duo',
  'realidea-grani',
  'realidea-dixi',
  'realidea-entresse',
  'realidea-fresko',
  'realidea-kale',
  'realidea-kivis',
  'realidea-liila',
  'realidea-lansikeskus',
];

export function getCampaignMallOptions(): CampaignMallOption[] {
  return REALIDEA_PROPERTIES
    .map((id) => MALLS[id])
    .filter((mall): mall is NonNullable<typeof mall> => Boolean(mall))
    .map((mall) => ({
      id: mall.id,
      name: mall.name,
      enabled: ENABLED_MALLS.has(mall.id),
    }));
}
