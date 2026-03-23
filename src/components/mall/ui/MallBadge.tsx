/**
 * Mall Badge Component
 *
 * Status indicators with semantic colors
 * Mall Status: LIVE, ALPHA, BETA, PLANNED
 * Semantic: success, warning, danger, info
 * Use cases: Mall integration status, campaign status, alert levels, feature flags
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MALL_TOKENS } from '@/styles/tokens/mall-tokens';

export type MallBadgeVariant =
  | 'live'
  | 'alpha'
  | 'beta'
  | 'planned'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface MallBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge style variant
   * @default 'info'
   */
  variant?: MallBadgeVariant;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Badge content
   */
  children?: React.ReactNode;
}

const variantStyles: Record<MallBadgeVariant, string> = {
  // Mall status badges (B&O muted colors)
  live: cn(
    'bg-bo-success-light text-bo-success-dark',
    'border border-bo-success/20'
  ),
  alpha: cn(
    'bg-bo-info-light text-bo-info-dark',
    'border border-bo-info/20'
  ),
  beta: cn(
    'bg-bo-warning-light text-bo-warning-dark',
    'border border-bo-warning/20'
  ),
  planned: cn(
    'bg-bo-neutral-100 text-bo-neutral-700',
    'border border-bo-neutral-300'
  ),
  // Semantic badges
  success: cn(
    'bg-bo-success-light text-bo-success-dark',
    'border border-bo-success/20'
  ),
  warning: cn(
    'bg-bo-warning-light text-bo-warning-dark',
    'border border-bo-warning/20'
  ),
  danger: cn(
    'bg-bo-error-light text-bo-error-dark',
    'border border-bo-error/20'
  ),
  info: cn(
    'bg-bo-info-light text-bo-info-dark',
    'border border-bo-info/20'
  ),
};

export const MallBadge = React.forwardRef<HTMLSpanElement, MallBadgeProps>(
  (
    {
      variant = 'info',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'px-3 py-1 rounded-md',
          'text-xs font-medium uppercase tracking-wider',
          // Variant styles
          variantStyles[variant],
          // Custom className
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

MallBadge.displayName = 'MallBadge';
