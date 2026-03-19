'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MapWrapper } from '@/components/map/MapWrapper';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import styles from './page.module.css';

type RightTab = 'map' | 'compare';

export default function Home() {
  const [rightTab, setRightTab] = useState<RightTab>('map');

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>Uvid</span>
          <span className={styles.logoAccent}>AI</span>
        </div>
        <nav className={styles.tabNav}>
          <button
            className={`${styles.tab} ${rightTab === 'map' ? styles.tabActive : ''}`}
            onClick={() => setRightTab('map')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Mapa
          </button>
          <button
            className={`${styles.tab} ${rightTab === 'compare' ? styles.tabActive : ''}`}
            onClick={() => setRightTab('compare')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Uporedi
          </button>
        </nav>
        <div className={styles.headerActions}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.chatPane}>
          <ChatPanel />
        </section>
        <section className={styles.mapPane}>
          {rightTab === 'map' ? (
            <MapWrapper />
          ) : (
            <ComparisonView />
          )}
        </section>
      </main>
    </div>
  );
}
