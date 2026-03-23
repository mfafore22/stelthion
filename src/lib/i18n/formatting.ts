/**
 * Locale-aware Formatting Utilities
 *
 * Number, date, time, and currency formatting using Intl API
 */

import { LOCALE_MAP, CURRENCY_MAP, type LanguageCode } from './config';

/**
 * Format number with locale
 */
export function formatNumber(
  value: number,
  language: LanguageCode,
  options?: Intl.NumberFormatOptions
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency with locale
 */
export function formatCurrency(
  value: number,
  language: LanguageCode,
  currency?: string
): string {
  const locale = LOCALE_MAP[language];
  const currencyCode = currency || CURRENCY_MAP[language];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  language: LanguageCode,
  decimals: number = 1
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format compact number (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(
  value: number,
  language: LanguageCode
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string | number,
  language: LanguageCode,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const locale = LOCALE_MAP[language];
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const options = ({
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  } as const)[format];

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format time
 */
export function formatTime(
  date: Date | string | number,
  language: LanguageCode,
  includeSeconds: boolean = false
): string {
  const locale = LOCALE_MAP[language];
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    ...(includeSeconds && { second: 'numeric' }),
  }).format(dateObj);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string | number,
  language: LanguageCode,
  dateFormat: 'short' | 'medium' | 'long' = 'medium'
): string {
  const locale = LOCALE_MAP[language];
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const dateOptions: Intl.DateTimeFormatOptions = ({
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
  } as const)[dateFormat];

  return new Intl.DateTimeFormat(locale, {
    ...dateOptions,
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  language: LanguageCode,
  t: (key: string, options?: any) => string
): string {
  const now = new Date();
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Use translation function for relative time strings
  if (diffSecs < 60) return t('common:time.justNow');
  if (diffMins === 1) return t('common:time.minuteAgo', { count: 1 });
  if (diffMins < 60) return t('common:time.minuteAgo', { count: diffMins });
  if (diffHours === 1) return t('common:time.hourAgo', { count: 1 });
  if (diffHours < 24) return t('common:time.hourAgo', { count: diffHours });
  if (diffDays === 1) return t('common:time.yesterday');
  if (diffDays < 7) return t('common:time.dayAgo', { count: diffDays });

  // For older dates, show formatted date
  return formatDate(dateObj, language, 'short');
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  language: LanguageCode
): string {
  const locale = LOCALE_MAP[language];
  const startObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).formatRange(startObj, endObj);
}

/**
 * Format list (e.g., "A, B, and C")
 */
export function formatList(
  items: string[],
  language: LanguageCode,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.ListFormat(locale, { type }).format(items);
}

/**
 * Format file size
 */
export function formatFileSize(
  bytes: number,
  language: LanguageCode,
  decimals: number = 2
): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${formatNumber(bytes / Math.pow(k, i), language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${sizes[i]}`;
}

/**
 * Format duration (in minutes)
 */
export function formatDuration(
  minutes: number,
  language: LanguageCode,
  t: (key: string, options?: any) => string
): string {
  if (minutes < 60) {
    return `${minutes} ${t('common:time.minutes')}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ${t('common:time.hours')}`;
  }

  return `${hours}${t('common:time.hour')} ${mins}${t('common:time.minute')}`;
}

/**
 * Parse number from localized string
 */
export function parseLocalizedNumber(
  value: string,
  language: LanguageCode
): number {
  const locale = LOCALE_MAP[language];

  // Get locale-specific decimal and thousand separators
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimalSeparator = parts.find(p => p.type === 'decimal')?.value || '.';
  const thousandSeparator = parts.find(p => p.type === 'group')?.value || ',';

  // Remove thousand separators and replace decimal separator with '.'
  const normalized = value
    .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    .replace(decimalSeparator, '.');

  return parseFloat(normalized);
}
