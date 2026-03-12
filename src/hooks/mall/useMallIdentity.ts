/**
 * useMallIdentity Hook
 * React hook for accessing mall brand identity
 */

import { useMemo } from 'react';
import {
  getMallIdentity,
  getContrastTextColor,
  getMallCSSVars,
  type MallIdentity,
} from '@/lib/mall/mallIdentity';

export interface MallIdentityContext extends MallIdentity {
  /**
   * Get appropriate text color for the primary brand color
   */
  primaryTextColor: 'white' | 'black';

  /**
   * Get appropriate text color for the secondary brand color
   */
  secondaryTextColor: 'white' | 'black';

  /**
   * CSS custom properties for theming
   */
  cssVars: Record<string, string>;

  /**
   * Gradient CSS string for backgrounds
   */
  gradientCSS: string;
}

/**
 * Hook to get mall brand identity and theming utilities
 *
 * @example
 * ```tsx
 * function MallCard({ mallId }) {
 *   const identity = useMallIdentity(mallId);
 *
 *   return (
 *     <div style={{ borderColor: identity.colors.primary }}>
 *       <h3 style={{ color: identity.colors.primary }}>
 *         {identity.name}
 *       </h3>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMallIdentity(mallId: string): MallIdentityContext {
  return useMemo(() => {
    const identity = getMallIdentity(mallId);

    return {
      ...identity,
      primaryTextColor: getContrastTextColor(identity.colors.primary),
      secondaryTextColor: getContrastTextColor(identity.colors.secondary),
      cssVars: getMallCSSVars(identity),
      gradientCSS: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
    };
  }, [mallId]);
}
