import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  t as translate,
  type SupportedLocale,
  type TranslationKey,
} from '@uvidai/i18n';

const LOCALES: SupportedLocale[] = ['sr-Latn', 'sr-Cyrl', 'en', 'ru'];

function normalizeLocale(value: string | null): SupportedLocale {
  if (value && LOCALES.includes(value as SupportedLocale)) {
    return value as SupportedLocale;
  }
  return 'sr-Latn';
}

export const useLocaleStore = create<{
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
}>()(
  persist(
    (set) => ({
      locale: 'sr-Latn',
      setLocale: (locale) => set({ locale: normalizeLocale(locale) }),
    }),
    {
      name: 'uvidai-lang',
      partialize: (s) => ({ locale: s.locale }),
    },
  ),
);

/** Hook for translated strings; safe outside React context (no Provider). */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale],
  );
}
