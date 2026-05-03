/**
 * Mall Card Component
 *
 * Content container with optional hover effects and clickable variant
 * Variants: basic, hover (for interactive cards)
 * Uses: Mall cards, KPI containers, campaign summaries, data panels
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MallCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Enable hover effects (for clickable cards)
   * @default false
   */
  hover?: boolean;
  /**
   * Make the card clickable
   */
  onClick?: () => void;
  /**
   * Card padding size
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Material variant (B&O-inspired)
   * @default 'elevated'
   */
  variant?: 'elevated' | 'glass' | 'aluminum' | 'flat';
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Card content
   */
  children?: React.ReactNode;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles = {
  elevated: cn(
    'bg-bo-glass rounded-xl shadow-bo-glass-strong border-2 border-bo-neutral-300/60 backdrop-blur-xl'
  ),
  glass: cn(
    'bg-bo-glass rounded-xl border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl'
  ),
  aluminum: cn(
    'bg-aluminum-surface rounded-xl shadow-bo-aluminum-top shadow-bo-aluminum-bottom'
  ),
  flat: cn(
    'bg-bo-neutral-50 rounded-xl border border-bo-neutral-200'
  ),
};

export const MallCard = React.forwardRef<HTMLDivElement, MallCardProps>(
  (
    {
      hover = false,
      onClick,
      padding = 'md',
      variant = 'elevated',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isClickable = Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          // Base styles
          'transition-all duration-300 ease-bo-out-expo',
          paddingStyles[padding],
          // Variant styles
          variantStyles[variant],
          // Hover styles (B&O lift effect)
          hover && 'bo-surface-hover',
          // Clickable styles
          isClickable && 'cursor-pointer active:translate-y-0 active:duration-100',
          // Custom className
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MallCard.displayName = 'MallCard';

/**
 * Card Header - Styled header section for cards
 */
export interface MallCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const MallCardHeader = React.forwardRef<HTMLDivElement, MallCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-xl font-semibold text-bo-neutral-900 mb-3 tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MallCardHeader.displayName = 'MallCardHeader';

/**
 * Card Body - Styled body section for cards
 */
export interface MallCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const MallCardBody = React.forwardRef<HTMLDivElement, MallCardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-base text-bo-neutral-700 leading-relaxed',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MallCardBody.displayName = 'MallCardBody';

/**
 * Card Footer - Styled footer section for cards
 */
export interface MallCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const MallCardFooter = React.forwardRef<HTMLDivElement, MallCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-6 pt-4 border-t border-bo-neutral-200',
          'text-sm text-bo-neutral-600',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MallCardFooter.displayName = 'MallCardFooter';
