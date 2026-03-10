/**
 * Mall Input Component
 *
 * Form input with label, validation states, and error messages
 * States: default, focus, error, disabled
 * Supports: text, email, number, tel, url, search, password
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MallInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below input
   */
  helperText?: string;
  /**
   * Show required indicator
   * @default false
   */
  required?: boolean;
  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Optional className for the container
   */
  containerClassName?: string;
  /**
   * Optional className for the input element
   */
  className?: string;
}

export const MallInput = React.forwardRef<HTMLInputElement, MallInputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      fullWidth = false,
      containerClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `mall-input-${React.useId()}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-bo-neutral-700 tracking-wide',
              disabled && 'text-bo-neutral-400'
            )}
          >
            {label}
            {required && (
              <span className="text-bo-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          ) || undefined}
          className={cn(
            // Base styles
            'w-full px-4 py-2.5 rounded-lg bg-bo-neutral-50',
            'text-base text-bo-neutral-900',
            'border transition-all duration-200 ease-bo-out',
            'placeholder:text-bo-neutral-500',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Default state
            !hasError && !disabled && 'border-bo-neutral-300 focus:border-bo-primary-600 focus:ring-bo-primary-600/20 hover:border-bo-neutral-400',
            // Error state
            hasError && 'border-bo-error focus:border-bo-error focus:ring-bo-error/20',
            // Disabled state
            disabled && 'bg-bo-neutral-100 text-bo-neutral-500 cursor-not-allowed border-bo-neutral-200',
            // Custom className
            className
          )}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="text-xs text-bo-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p
            id={helperId}
            className={cn(
              'text-xs leading-relaxed',
              disabled ? 'text-bo-neutral-400' : 'text-bo-neutral-600'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MallInput.displayName = 'MallInput';
