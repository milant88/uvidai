import type { ReactNode } from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'danger';
}

export function GlassCard({
  children,
  className = '',
  variant = 'default',
}: GlassCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
