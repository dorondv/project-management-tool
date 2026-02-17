import type { Locale } from '../types';
import { isSupportedLocale } from '../types';

/** Use for inline translation objects: at least `en` required; other locales optional (fallback to en). */
export type TranslationMap<T> = Partial<Record<Locale, T>> & { en: T };
import en from './locales/en.json';
import he from './locales/he.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';

const packs: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  he: he as Record<string, string>,
  es: es as Record<string, string>,
  de: de as Record<string, string>,
  pt: pt as Record<string, string>,
  fr: fr as Record<string, string>,
};

/**
 * Translate a key for the given locale. Fallback chain: selected locale -> en -> key.
 */
export function t(key: string, locale: Locale, params?: Record<string, string>): string {
  const effectiveLocale = isSupportedLocale(locale) ? locale : 'en';
  const pack = packs[effectiveLocale] ?? packs.en;
  const enPack = packs.en;
  let value = pack[key] ?? enPack[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
  }
  return value;
}

/**
 * Safe read for inline translation objects: returns translations[locale] or translations.en.
 */
export function getT<T>(translations: Partial<Record<Locale, T>> & { en: T }, locale: Locale): T {
  return (translations[locale] ?? translations.en) as T;
}

export { isSupportedLocale };
