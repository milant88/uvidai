/* eslint-disable @typescript-eslint/no-require-imports */
const srLatn = require('./locales/sr-Latn.json') as typeof import('./locales/en.json');
const srCyrl = require('./locales/sr-Cyrl.json') as typeof import('./locales/en.json');
const en = require('./locales/en.json') as typeof import('./locales/en.json');
const ru = require('./locales/ru.json') as typeof import('./locales/en.json');

export { latinToCyrillic, cyrillicToLatin, isCyrillic } from './transliterate.js';

// ---------------------------------------------------------------------------
// Translation key types (derived from en.json structure)
// ---------------------------------------------------------------------------

type TranslationTree = typeof en;

/** Dot-notation paths into the translation JSON (e.g. "nav.home", "chat.greeting") */
export type TranslationKey = FlattenKeys<TranslationTree>;

/** Recursively flatten nested object keys into dot-separated strings */
type FlattenKeys<T, Prefix extends string = ''> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? FlattenKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type SupportedLocale = 'sr-Latn' | 'sr-Cyrl' | 'en' | 'ru';

const locales: Record<SupportedLocale, TranslationTree> = {
  'sr-Latn': srLatn,
  'sr-Cyrl': srCyrl,
  en,
  ru,
};

/**
 * Get the translation tree for a locale.
 */
export function getTranslations(locale: SupportedLocale): TranslationTree {
  return locales[locale];
}

/**
 * Resolve a dot-notation key to its translated string.
 *
 * Returns the key itself if the path is not found (fail-safe).
 */
export function t(locale: SupportedLocale, key: TranslationKey): string {
  const parts = key.split('.');
  let node: unknown = locales[locale];

  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key;
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === 'string' ? node : key;
}

/**
 * List all supported locales.
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(locales) as SupportedLocale[];
}
