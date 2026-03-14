import { ChatPanel } from '@/components/chat/ChatPanel';
import { MapWrapper } from '@/components/map/MapWrapper';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.shell}>
      {/* ── Header ──────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>Uvid</span>
          <span className={styles.logoAccent}>AI</span>
        </div>
        <div className={styles.headerActions}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────── */}
      <main className={styles.main}>
        <section className={styles.chatPane}>
          <ChatPanel />
        </section>
        <section className={styles.mapPane}>
          <MapWrapper />
        </section>
      </main>
    </div>
  );
}
