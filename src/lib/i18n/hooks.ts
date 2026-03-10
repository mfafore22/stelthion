/**
 * i18n React Hooks
 *
 * Custom hooks for internationalization
 */

'use client';

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { LanguageCode } from './config';
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatDateRange,
  formatList,
  formatFileSize,
  formatDuration,
} from './formatting';

/**
 * Enhanced useTranslation hook with formatting utilities
 */
export function useTranslation(namespace?: string | string[]) {
  const { t, i18n } = useI18nextTranslation(namespace);
  const language = i18n.language as LanguageCode;

  const formatters = {
    number: useCallback(
      (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, language, options),
      [language]
    ),
    currency: useCallback(
      (value: number, currency?: string) =>
        formatCurrency(value, language, currency),
      [language]
    ),
    percentage: useCallback(
      (value: number, decimals?: number) =>
        formatPercentage(value, language, decimals),
      [language]
    ),
    compact: useCallback(
      (value: number) =>
        formatCompactNumber(value, language),
      [language]
    ),
    date: useCallback(
      (date: Date | string | number, format?: 'short' | 'medium' | 'long' | 'full') =>
        formatDate(date, language, format),
      [language]
    ),
    time: useCallback(
      (date: Date | string | number, includeSeconds?: boolean) =>
        formatTime(date, language, includeSeconds),
      [language]
    ),
    dateTime: useCallback(
      (date: Date | string | number, dateFormat?: 'short' | 'medium' | 'long') =>
        formatDateTime(date, language, dateFormat),
      [language]
    ),
    relativeTime: useCallback(
      (date: Date | string | number) =>
        formatRelativeTime(date, language, t),
      [language, t]
    ),
    dateRange: useCallback(
      (startDate: Date | string | number, endDate: Date | string | number) =>
        formatDateRange(startDate, endDate, language),
      [language]
    ),
    list: useCallback(
      (items: string[], type?: 'conjunction' | 'disjunction') =>
        formatList(items, language, type),
      [language]
    ),
    fileSize: useCallback(
      (bytes: number, decimals?: number) =>
        formatFileSize(bytes, language, decimals),
      [language]
    ),
    duration: useCallback(
      (minutes: number) =>
        formatDuration(minutes, language, t),
      [language, t]
    ),
  };

  return {
    t,
    i18n,
    language,
    ...formatters,
  };
}

/**
 * Hook for language switching
 */
export function useLanguage() {
  const { i18n } = useI18nextTranslation();

  const changeLanguage = useCallback(
    (language: LanguageCode) => {
      i18n.changeLanguage(language);
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('stelthion-language', language);
      }
    },
    [i18n]
  );

  return {
    currentLanguage: i18n.language as LanguageCode,
    changeLanguage,
    isReady: i18n.isInitialized,
  };
}

/**
 * Hook for namespaced translations
 */
export function useNamespacedTranslation(namespace: string) {
  return useTranslation(namespace);
}
