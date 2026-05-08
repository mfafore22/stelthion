/**
 * Mall Identity System
 * Utilities for accessing mall brand profiles, colors, and theming.
 *
 * Resolution chain (first match wins):
 *   1. profiles[mallId]            — explicit per-mall brand
 *   2. customerFallback[customerId] — tenant-level fallback (e.g. Realidea Oy navy
 *      for any Realidea mall without a specific profile yet)
 *   3. fallback                    — neutral Stelthion grey
 */

import brandProfiles from '../../../data/malls/brandProfiles.json';
import { getMall, getMallBrandColors } from './mallDatabase';
import { getMallLogo } from './mallLogos';

export interface MallColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface MallGradient {
  from: string;
  to: string;
}

export interface MallTypography {
  fontFamily: string;
  headingWeight: number;
}

export interface MallIdentity {
  id: string;
  name: string;
  logo: string;
  colors: MallColors;
  gradient: MallGradient;
  typography: MallTypography;
}

/**
 * Get mall identity by ID.
 * Pass `customerId` to allow tenant-level fallback when no per-mall profile exists.
 */
export function getMallIdentity(mallId: string, customerId?: string): MallIdentity {
  const profile = brandProfiles.profiles[mallId as keyof typeof brandProfiles.profiles];
  if (profile) {
    return { id: mallId, ...profile } as MallIdentity;
  }

  if (customerId) {
    const tenantProfile =
      brandProfiles.customerFallback?.[customerId as keyof typeof brandProfiles.customerFallback];
    if (tenantProfile) {
      return { id: customerId, ...tenantProfile } as MallIdentity;
    }
  }

  const mall = getMall(mallId);
  if (mall) {
    const colors = getMallBrandColors(mallId);
    return {
      id: mallId,
      name: mall.name,
      logo: getMallLogo(mallId) ?? '',
      colors: {
        ...colors,
        background: '#F8F6F3',
      },
      gradient: {
        from: colors.primary,
        to: colors.secondary,
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        headingWeight: 700,
      },
    };
  }

  return { id: 'fallback', ...brandProfiles.fallback } as MallIdentity;
}

/**
 * Calculate relative luminance for a hex color
 * Used to determine if text should be light or dark
 * Formula from WCAG 2.0
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get appropriate text color (white or black) based on background luminance
 * Ensures WCAG AA contrast ratio
 */
export function getContrastTextColor(backgroundColor: string): 'white' | 'black' {
  const luminance = getLuminance(backgroundColor);
  // Use white text for dark backgrounds (luminance < 0.5)
  return luminance < 0.5 ? 'white' : 'black';
}

/**
 * Check if a mall has a custom brand profile
 */
export function hasMallIdentity(mallId: string): boolean {
  return mallId in brandProfiles.profiles;
}

/**
 * Get all available mall identities
 */
export function getAllMallIdentities(): MallIdentity[] {
  return Object.keys(brandProfiles.profiles).map((mallId) => getMallIdentity(mallId));
}

/**
 * Generate CSS custom properties for a mall identity
 * Useful for dynamic theming
 */
export function getMallCSSVars(identity: MallIdentity): Record<string, string> {
  return {
    '--mall-identity-primary': identity.colors.primary,
    '--mall-identity-secondary': identity.colors.secondary,
    '--mall-identity-accent': identity.colors.accent,
    '--mall-identity-background': identity.colors.background,
    '--mall-identity-gradient-from': identity.gradient.from,
    '--mall-identity-gradient-to': identity.gradient.to,
  };
}
