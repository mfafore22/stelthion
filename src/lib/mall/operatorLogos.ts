export function getOperatorLogo(companyName: string): string | null {
  const normalizedName = companyName.toLowerCase().trim();

  const logoMap: Record<string, string> = {
    'koy ideapark ab': '/assets/mall-operators/ideapark-logo.png',
    'koy ideapark oy': '/assets/mall-operators/ideapark-logo.png',
    'realidea oy': '/realidea-logo.webp',
  };

  return logoMap[normalizedName] || null;
}

export function getOperatorLogoOrFallback(companyName: string): {
  type: 'image' | 'letter';
  value: string;
} {
  const logo = getOperatorLogo(companyName);

  if (logo) {
    return { type: 'image', value: logo };
  }

  return {
    type: 'letter',
    value: companyName.charAt(0).toUpperCase(),
  };
}