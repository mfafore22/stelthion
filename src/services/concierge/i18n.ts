/**
 * Internationalization (i18n) for Concierge
 *
 * Finnish and English language support with graceful fallback
 */

import { Translation, LanguageResult } from './types';

/**
 * Translation dictionary
 */
const TRANSLATIONS: Translation[] = [
  // UI Labels
  { key: 'concierge', en: 'Concierge', fi: 'Concierge' },
  { key: 'newConversation', en: 'New Conversation', fi: 'Uusi keskustelu' },
  { key: 'recent', en: 'Recent', fi: 'Viimeisimmät' },
  { key: 'agent', en: 'Agent', fi: 'Agentti' },
  { key: 'tenant', en: 'Tenant', fi: 'Vuokralainen' },
  { key: 'you', en: 'You', fi: 'Sinä' },

  // Actions
  { key: 'send', en: 'Send', fi: 'Lähetä' },
  { key: 'stop', en: 'Stop', fi: 'Pysäytä' },
  { key: 'retry', en: 'Retry', fi: 'Yritä uudelleen' },
  { key: 'delete', en: 'Delete', fi: 'Poista' },
  { key: 'export', en: 'Export', fi: 'Vie' },
  { key: 'share', en: 'Share', fi: 'Jaa' },
  { key: 'select', en: 'Select', fi: 'Valitse' },
  { key: 'cancel', en: 'Cancel', fi: 'Peruuta' },
  { key: 'close', en: 'Close', fi: 'Sulje' },
  { key: 'rename', en: 'Rename', fi: 'Nimeä uudelleen' },

  // Messages
  { key: 'typeMessage', en: 'Type your message...', fi: 'Kirjoita viestisi...' },
  { key: 'sending', en: 'Sending...', fi: 'Lähetetään...' },
  { key: 'loading', en: 'Loading...', fi: 'Ladataan...' },
  { key: 'processing', en: 'Processing...', fi: 'Käsitellään...' },
  { key: 'thinking', en: 'Thinking...', fi: 'Ajattelen...' },
  { key: 'analyzing', en: 'Analyzing...', fi: 'Analysoidaan...' },

  // Empty States
  { key: 'noConversations', en: 'No conversations yet.\nStart a new one!', fi: 'Ei keskusteluja.\nAloita uusi!' },
  { key: 'startConversation', en: 'Start a Conversation', fi: 'Aloita keskustelu' },
  { key: 'askAnything', en: 'Ask me anything...', fi: 'Kysy mitä vain...' },

  // Agent Selection
  { key: 'selectAgent', en: 'Select Agent', fi: 'Valitse agentti' },
  { key: 'chooseAgent', en: 'Choose the best agent for your task:', fi: 'Valitse paras agentti tehtävällesi:' },
  { key: 'notSure', en: 'Not sure?', fi: 'Etkö ole varma?' },
  { key: 'generalAssistantSuggestion', en: 'Start with General Assistant', fi: 'Aloita yleisavustajalla' },
  { key: 'bestFor', en: 'Best for:', fi: 'Parhaiten soveltuu:' },

  // Agent Names
  { key: 'salesOptimizer', en: 'Sales Optimizer', fi: 'Myyntioptimija' },
  { key: 'footfallAnalyst', en: 'Footfall Analyst', fi: 'Kävijämääräanalyytikko' },
  { key: 'eventCoordinator', en: 'Event Coordinator', fi: 'Tapahtumakoordinaattori' },
  { key: 'parkingManager', en: 'Parking Manager', fi: 'Pysäköintipäällikkö' },
  { key: 'trendAnalyst', en: 'Trend Analyst', fi: 'Trendianalyytikko' },
  { key: 'generalAssistant', en: 'General Assistant', fi: 'Yleisavustaja' },

  // Tool Execution
  { key: 'toolExecution', en: 'Tool Execution', fi: 'Työkalun suoritus' },
  { key: 'tools', en: 'tools', fi: 'työkalua' },
  { key: 'pending', en: 'Pending', fi: 'Odottaa' },
  { key: 'running', en: 'Running', fi: 'Käynnissä' },
  { key: 'complete', en: 'Complete', fi: 'Valmis' },
  { key: 'error', en: 'Error', fi: 'Virhe' },
  { key: 'retrieved', en: 'Retrieved', fi: 'Haettu' },
  { key: 'records', en: 'records', fi: 'tietuetta' },
  { key: 'parameters', en: 'parameters', fi: 'parametria' },
  { key: 'showDetails', en: 'Show Details', fi: 'Näytä yksityiskohdat' },
  { key: 'hideDetails', en: 'Hide Details', fi: 'Piilota yksityiskohdat' },

  // Conversation
  { key: 'messages', en: 'messages', fi: 'viestiä' },
  { key: 'toolsUsed', en: 'tools used', fi: 'työkalua käytetty' },
  { key: 'scrollToBottom', en: 'Scroll to bottom', fi: 'Vieritä alas' },

  // Errors
  { key: 'connectionError', en: 'Connection Error', fi: 'Yhteysvirhe' },
  { key: 'connectionErrorMsg', en: 'Unable to connect to the server. Please check your internet connection.', fi: 'Palvelimeen ei saada yhteyttä. Tarkista internetyhteytesi.' },
  { key: 'toolError', en: 'I encountered an error retrieving the data.', fi: 'Kohtasin virheen tietoja haettaessa.' },
  { key: 'accessDenied', en: 'Access denied', fi: 'Pääsy estetty' },

  // Finnish Apology (for fallback)
  { key: 'translationNotAvailable', en: 'Translation not available', fi: 'Anteeksi, käännös ei ole saatavilla. Vastaan englanniksi:' },
];

/**
 * Translation map for quick lookup
 */
const translationMap = new Map<string, Translation>();
TRANSLATIONS.forEach((t) => translationMap.set(t.key, t));

/**
 * Get translation
 */
export function t(key: string, language: 'en' | 'fi' = 'en'): string {
  const translation = translationMap.get(key);
  return translation ? translation[language] : key;
}

/**
 * Translate with fallback
 *
 * If Finnish translation is not available, returns English with Finnish apology
 */
export function translateWithFallback(
  key: string,
  language: 'en' | 'fi',
  englishFallback?: string
): LanguageResult {
  const translation = translationMap.get(key);

  if (!translation) {
    // No translation exists
    if (language === 'fi' && englishFallback) {
      return {
        text: englishFallback,
        language: 'en',
        isFallback: true,
        apologyText: t('translationNotAvailable', 'fi'),
      };
    }

    return {
      text: englishFallback || key,
      language: 'en',
      isFallback: true,
    };
  }

  // Use specified language
  return {
    text: translation[language],
    language,
    isFallback: false,
  };
}

/**
 * Format number with locale
 */
export function formatNumber(value: number, language: 'en' | 'fi'): string {
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format currency (EUR)
 */
export function formatCurrency(value: number, language: 'en' | 'fi'): string {
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(date: Date, language: 'en' | 'fi', format: 'short' | 'long' = 'short'): string {
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';

  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'numeric', day: 'numeric' };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, language: 'en' | 'fi'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (language === 'fi') {
    if (diffSecs < 60) return 'Juuri nyt';
    if (diffMins === 1) return '1 minuutti sitten';
    if (diffMins < 60) return `${diffMins} minuuttia sitten`;
    if (diffHours === 1) return '1 tunti sitten';
    if (diffHours < 24) return `${diffHours} tuntia sitten`;
    if (diffDays === 1) return 'Eilen';
    if (diffDays < 7) return `${diffDays} päivää sitten`;
    return formatDate(date, 'fi', 'short');
  } else {
    if (diffSecs < 60) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date, 'en', 'short');
  }
}

/**
 * Pluralize (basic implementation)
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  language: 'en' | 'fi'
): string {
  if (language === 'fi') {
    // Finnish plural rules are complex, this is simplified
    return count === 1 ? singular : plural;
  } else {
    return count === 1 ? singular : plural;
  }
}
