/**
 * Mall Button Component
 *
 * Primary interactive element with 5 variants and 3 sizes
 * Variants: primary, secondary, success, danger, ghost
 * Sizes: sm, md (default), lg
 * States: default, hover, disabled, loading
 */

'use client';

import React from 'react';
import { SwirlLoader } from '@/components/ui/SwirlLoader';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface MallButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Button size
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Show loading spinner and disable interaction
   * @default false
   */
  loading?: boolean;
  /**
   * Optional icon to display before text
   */
  icon?: React.ReactNode;
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Button content
   */
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-bo-neutral-950 text-bo-neutral-50',
    'hover:bg-bo-neutral-900 hover:shadow-bo-lg hover:-translate-y-0.5',
    'focus:outline-none focus:ring-2 focus:ring-bo-primary-600 focus:ring-opacity-20',
    'disabled:bg-bo-neutral-300 disabled:text-bo-neutral-500 disabled:shadow-none disabled:translate-y-0',
    'shadow-bo-md transition-all duration-300 ease-bo-out-expo'
  ),
  secondary: cn(
    'bo-interactive-box text-bo-neutral-700',
    'focus:outline-none focus:ring-2 focus:ring-bo-primary-600 focus:ring-opacity-20',
    'disabled:bg-transparent disabled:text-bo-neutral-400 disabled:border-bo-neutral-200'
  ),
  success: cn(
    'bg-bo-success text-white',
    'hover:bg-bo-success-dark hover:shadow-bo-md hover:-translate-y-0.5',
    'focus:outline-none focus:ring-2 focus:ring-bo-success focus:ring-opacity-20',
    'disabled:bg-bo-neutral-300 disabled:text-bo-neutral-500 disabled:shadow-none disabled:translate-y-0',
    'shadow-bo-sm transition-all duration-300 ease-bo-out-expo'
  ),
  danger: cn(
    'bg-bo-error text-white',
    'hover:bg-bo-error-dark hover:shadow-bo-md hover:-translate-y-0.5',
    'focus:outline-none focus:ring-2 focus:ring-bo-error focus:ring-opacity-20',
    'disabled:bg-bo-neutral-300 disabled:text-bo-neutral-500 disabled:shadow-none disabled:translate-y-0',
    'shadow-bo-sm transition-all duration-300 ease-bo-out-expo'
  ),
  ghost: cn(
    'bg-transparent text-bo-neutral-700',
    'hover:bg-white/35 hover:text-bo-neutral-950',
    'focus:outline-none focus:ring-2 focus:ring-bo-neutral-400 focus:ring-opacity-20',
    'disabled:text-bo-neutral-400',
    'transition-colors duration-200 ease-bo-out'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm tracking-wide',
  md: 'px-6 py-3 text-base tracking-wide',
  lg: 'px-8 py-3.5 text-lg tracking-wide',
};

export const MallButton = React.forwardRef<HTMLButtonElement, MallButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-3',
          'font-medium rounded-lg',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'active:translate-y-0 active:duration-100',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          // Custom className
          className
        )}
        {...props}
      >
        {loading && <SwirlLoader size="sm" />}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

MallButton.displayName = 'MallButton';
