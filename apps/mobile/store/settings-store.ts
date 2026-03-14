import { create } from 'zustand';

export type Locale = 'sr-Latn' | 'sr-Cyrl' | 'en' | 'ru';
export type Theme = 'dark' | 'light' | 'system';

interface SettingsState {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: 'sr-Latn',
  theme: 'system',
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
}));
