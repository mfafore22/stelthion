export const MALL_LOGOS: Record<string, string> = {
  ideapark: '/assets/mall-operators/ideapark-logo.png',
};

export function getMallLogo(mallId: string): string | undefined {
  return MALL_LOGOS[mallId.toLowerCase()];
}

export function hasMallLogo(mallId: string): boolean {
  return mallId.toLowerCase() in MALL_LOGOS;
}