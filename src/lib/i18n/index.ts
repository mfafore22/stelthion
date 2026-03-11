/**
 * i18n Initialization — EN/FI only (mall namespace)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enMall from '@/locales/en/mall.json';
import fiMall from '@/locales/fi/mall.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { mall: enMall },
      fi: { mall: fiMall },
    },
    fallbackLng: 'en',
    defaultNS: 'mall',
    ns: ['mall'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],   // never auto-detect from browser locale
      caches: ['localStorage'],
      lookupLocalStorage: 'stelthion-language',
    },
    react: { useSuspense: false },
    supportedLngs: ['en', 'fi'],
  });

export default i18n;
