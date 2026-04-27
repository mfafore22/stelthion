export const MALL_LOGOS: Record<string, string> = {
  'ideapark-lempaala': '/ideapark-logo.svg',

  'realidea-sello': '/assets/mall-operators/Sello_logo.svg',
  'realidea-tripla': '/assets/mall-operators/MallofTripla_logo.png',
  'realidea-kamp-galleria': '/assets/mall-operators/kampgalleria_logo_moss_green_rgb.png',
  'realidea-karuselli': '/assets/mall-operators/Karuselli_logo.svg',
  'realidea-plaza': '/assets/mall-operators/kauppakeskus-plaza-logo.svg',
  'realidea-columbus': '/assets/mall-operators/columbus-c-ikoni.png',
  'realidea-arabia': '/assets/mall-operators/arabia-logo-tumma.png',
  'realidea-dixi': '/assets/mall-operators/dixi-logo.svg',
  'realidea-duo': '/assets/mall-operators/duo_logo.png',
  'realidea-kivis': '/assets/mall-operators/kivis_logo_oranssi.svg',
  'realidea-fresko': '/assets/mall-operators/Fresko_logo.png',
  'realidea-kale': '/assets/mall-operators/Kale_logo.png',
  'realidea-grani': '/assets/mall-operators/Grani_merkki.png',
  'realidea-liila': '/assets/mall-operators/liila_logo.svg',
  'realidea-lansikeskus': '/assets/mall-operators/Länsikeskuslogo.png',
};

export const OPERATOR_LOGOS: Record<string, string> = {
  koy_ideapark: '/ideapark-logo.svg',
  realidea: '/assets/mall-operators/realidea-logo.webp',
};

const LEGACY_LOGO_ALIASES: Record<string, string> = {
  ideapark: 'ideapark-lempaala',
  sello: 'realidea-sello',
  tripla: 'realidea-tripla',
  itis: 'realidea-itis',
  jumbo: 'realidea-jumbo',
  'kamp-galleria': 'realidea-kamp-galleria',
  karuselli: 'realidea-karuselli',
  plaza: 'realidea-plaza',
  arabia: 'realidea-arabia',
  columbus: 'realidea-columbus',
  duo: 'realidea-duo',
  grani: 'realidea-grani',
  dixi: 'realidea-dixi',
  entresse: 'realidea-entresse',
  fresko: 'realidea-fresko',
  kale: 'realidea-kale',
  kivis: 'realidea-kivis',
  liila: 'realidea-liila',
  lansikeskus: 'realidea-lansikeskus',
};

export function getMallLogo(mallId: string): string | undefined {
  if (!mallId) return undefined;
  const key = mallId.toLowerCase();
  const exact = MALL_LOGOS[key];
  if (exact) return exact;
  const aliased = LEGACY_LOGO_ALIASES[key];
  return aliased ? MALL_LOGOS[aliased] : undefined;
}

export function hasMallLogo(mallId: string): boolean {
  return getMallLogo(mallId) !== undefined;
}

export function getOperatorLogo(operatorId: string): string | undefined {
  return OPERATOR_LOGOS[operatorId];
}
