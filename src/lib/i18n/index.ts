/**
 * i18n Initialization — EN/FI/SV (mall namespace)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enMall from '@/locales/en/mall.json';
import fiMall from '@/locales/fi/mall.json';
import svMall from '@/locales/sv/mall.json';
import enAdmin from '@/locales/en/admin.json';
import fiAdmin from '@/locales/fi/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { mall: enMall, admin: enAdmin },
      fi: { mall: fiMall, admin: fiAdmin },
      sv: { mall: svMall },
    },
    lng: 'fi',
    fallbackLng: 'en',
    defaultNS: 'mall',
    ns: ['mall', 'admin'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],   // never auto-detect from browser locale
      caches: ['localStorage'],
      lookupLocalStorage: 'stelthion-language',
    },
    initImmediate: false,
    react: { useSuspense: false },
    supportedLngs: ['en', 'fi', 'sv'],
  });

export default i18n;
