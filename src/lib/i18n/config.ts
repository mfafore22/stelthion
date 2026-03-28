/**
 * i18n Configuration
 *
 * Multi-language support for 16 languages across Europe
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'GB' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: 'FI' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: 'SE' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: 'NO' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: 'DK' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: 'ES' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: 'EE' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: 'LV' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: 'NL' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: 'FR' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: 'IT' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: 'PL' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: 'LT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: 'PT' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: 'CZ' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'fi';

export const FALLBACK_LANGUAGE: LanguageCode = 'en';

/**
 * Locale mappings for Intl API
 */
export const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  fi: 'fi-FI',
  sv: 'sv-SE',
  no: 'nb-NO',
  da: 'da-DK',
  es: 'es-ES',
  de: 'de-DE',
  et: 'et-EE',
  lv: 'lv-LV',
  nl: 'nl-NL',
  fr: 'fr-FR',
  it: 'it-IT',
  pl: 'pl-PL',
  lt: 'lt-LT',
  pt: 'pt-PT',
  cs: 'cs-CZ',
};

/**
 * Currency settings per locale
 */
export const CURRENCY_MAP: Record<LanguageCode, string> = {
  en: 'EUR',
  fi: 'EUR',
  sv: 'SEK',
  no: 'NOK',
  da: 'DKK',
  es: 'EUR',
  de: 'EUR',
  et: 'EUR',
  lv: 'EUR',
  nl: 'EUR',
  fr: 'EUR',
  it: 'EUR',
  pl: 'PLN',
  lt: 'EUR',
  pt: 'EUR',
  cs: 'CZK',
};

/**
 * Translation namespaces
 */
export const NAMESPACES = [
  'common',
  'navigation',
  'concierge',
  'mall',
  'retail',
  'scenario',
  'forms',
  'errors',
  'kpi',
  'admin',
] as const;

export type Namespace = typeof NAMESPACES[number];
