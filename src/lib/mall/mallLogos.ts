/**
 * Mall Logo Mapping
 * Maps mall IDs to their logo file paths in /public/assets/mall-operators/
 */

export const MALL_LOGOS: Record<string, string> = {
  ideapark: '/assets/mall-operators/ideapark-logo.png',
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
