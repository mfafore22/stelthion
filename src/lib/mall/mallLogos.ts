/**
 * Mall Logo Mapping
 * Maps mall IDs to their logo file paths in /public/assets/mall-operators/
 */

export const MALL_LOGOS: Record<string, string> = {
  // Realidea portfolio malls
  sello: '/assets/mall-operators/Sello_logo.svg',
  tripla: '/assets/mall-operators/MallofTripla_logo.png',
  'kamp-galleria': '/assets/mall-operators/kampgalleria_logo_moss_green_rgb.png',
  karuselli: '/assets/mall-operators/Karuselli_logo.svg',
  plaza: '/assets/mall-operators/kauppakeskus-plaza-logo.svg',
  columbus: '/assets/mall-operators/columbus-c-ikoni.png',
  arabia: '/assets/mall-operators/arabia-logo-tumma.png',
  dixi: '/assets/mall-operators/dixi-logo.svg',
  duo: '/assets/mall-operators/duo_logo.png',
  kivis: '/assets/mall-operators/kivis_logo_oranssi.svg',
  fresko: '/assets/mall-operators/Fresko_logo.png',
  kale: '/assets/mall-operators/Kale_logo.png',
  grani: '/assets/mall-operators/Grani_merkki.png',
  liila: '/assets/mall-operators/liila_logo.svg',
  lansikeskus: '/assets/mall-operators/Länsikeskuslogo.png',
  'malmin-nova': '/assets/mall-operators/MalminNova-logo.png',
  'martinlaakson-ostari': '/assets/mall-operators/martinlaakson_ostari_pystytunnus_metsanvihrea.width-400.png',
};

/**
 * Get logo path for a mall ID
 * Returns logo path or undefined if no logo exists
 */
export function getMallLogo(mallId: string): string | undefined {
  return MALL_LOGOS[mallId.toLowerCase()];
}

/**
 * Check if a mall has a logo
 */
export function hasMallLogo(mallId: string): boolean {
  return mallId.toLowerCase() in MALL_LOGOS;
}
