/**
 * Operator Logo Mapping
 * Maps company/operator names to their logo file paths
 */

export function getOperatorLogo(companyName: string): string | null {
  const normalizedName = companyName.toLowerCase().trim();

  const logoMap: Record<string, string> = {
    'realidea': '/assets/mall-operators/realidea-logo.webp',
    'koy ideapark ab': '/assets/mall-operators/ideapark-logo.png',
    'koy ideapark oy': '/assets/mall-operators/ideapark-logo.png',
    'citycon oyj': '/assets/mall-operators/citycon-logo.png',
    'citycon': '/assets/mall-operators/citycon-logo.png',
  };

  return logoMap[normalizedName] || null;
}

/**
 * Get operator logo with fallback to first letter
 */
export function getOperatorLogoOrFallback(companyName: string): {
  type: 'image' | 'letter';
  value: string;
} {
  const logo = getOperatorLogo(companyName);

  if (logo) {
    return { type: 'image', value: logo };
  }

  // Fallback to first letter
  return {
    type: 'letter',
    value: companyName.charAt(0).toUpperCase(),
  };
}
