'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocaleStore } from '@/store/locale-store';
import type { SupportedLocale } from '@uvidai/i18n';
import styles from './LanguageSelector.module.css';

interface LangOption {
  code: SupportedLocale;
  label: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'sr-Latn', label: 'Srpski', flag: '🇷🇸' },
  { code: 'sr-Cyrl', label: 'Српски', flag: '🇷🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSelector() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(lang: LangOption) {
    setLocale(lang.code);
    setOpen(false);
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Izaberite jezik"
      >
        <span className={styles.flag}>{selected.flag}</span>
        <span className={styles.label}>{selected.label}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className={styles.dropdown} role="listbox">
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === selected.code}>
              <button
                className={`${styles.option} ${lang.code === selected.code ? styles.active : ''}`}
                onClick={() => pick(lang)}
              >
                <span className={styles.flag}>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
