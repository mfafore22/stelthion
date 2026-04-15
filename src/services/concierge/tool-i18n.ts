/**
 * Minimal server-side i18n for concierge tool titles and labels.
 * Loads from the same JSON locale files used client-side so keys stay in sync.
 */

import enMall from '@/locales/en/mall.json';
import fiMall from '@/locales/fi/mall.json';
import svMall from '@/locales/sv/mall.json';

type Bundle = Record<string, unknown>;

const BUNDLES: Record<string, Bundle> = {
  en: enMall as Bundle,
  fi: fiMall as Bundle,
  sv: svMall as Bundle,
};

function normaliseLang(lang?: string): 'fi' | 'sv' | 'en' {
  const code = (lang ?? 'en').toLowerCase().split('-')[0];
  if (code === 'fi' || code === 'sv') return code;
  return 'en';
}

function lookup(bundle: Bundle, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = bundle;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Bundle)) {
      cur = (cur as Bundle)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k) => String(vars[k] ?? `{{${k}}}`));
}

/**
 * Translate a mall.json key with optional interpolation.
 * Falls back to English and finally to the key itself.
 */
export function tServer(
  lang: string | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = normaliseLang(lang);
  const primaryHit = lookup(BUNDLES[primary], key);
  if (primaryHit) return interpolate(primaryHit, vars);
  if (primary !== 'en') {
    const enHit = lookup(BUNDLES.en, key);
    if (enHit) return interpolate(enHit, vars);
  }
  return key;
}

export function weekdayName(lang: string | undefined, weekday: number): string {
  return tServer(lang, `concierge.attachments.weekdays.${weekday}`);
}
