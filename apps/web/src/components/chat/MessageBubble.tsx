'use client';

import { useChatStore, type Message } from '@/store/chat-store';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('sr-Latn', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const addFeedback = useChatStore((s) => s.addFeedback);
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
        <div className={styles.content}>{renderContent(message.content)}</div>

        <div className={styles.meta}>
          <time className={styles.time}>{formatTime(message.timestamp)}</time>

          {!isUser && (
            <div className={styles.feedback}>
              <button
                className={`${styles.feedbackBtn} ${message.feedback === 'positive' ? styles.feedbackActive : ''}`}
                onClick={() => addFeedback(message.id, 'positive')}
                aria-label="Korisno"
                title="Korisno"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button
                className={`${styles.feedbackBtn} ${message.feedback === 'negative' ? styles.feedbackActive : ''}`}
                onClick={() => addFeedback(message.id, 'negative')}
                aria-label="Nije korisno"
                title="Nije korisno"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                  <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
