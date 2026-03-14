'use client';

import styles from './MetricRow.module.css';

export type ComparisonIndicator = 'better' | 'worse' | 'neutral';

interface MetricRowProps {
  label: string;
  value: string | number;
  indicator?: ComparisonIndicator;
}

function IndicatorIcon({ indicator }: { indicator: ComparisonIndicator }) {
  switch (indicator) {
    case 'better':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      );
    case 'worse':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case 'neutral':
    default:
      return <span aria-hidden>—</span>;
  }
}

export function MetricRow({ label, value, indicator = 'neutral' }: MetricRowProps) {
  const indicatorClass =
    indicator === 'better' ? styles.indicatorBetter : indicator === 'worse' ? styles.indicatorWorse : styles.indicatorNeutral;

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.valueWrapper}>
        <span className={styles.value}>{value}</span>
        <span className={`${styles.indicator} ${indicatorClass}`} aria-hidden>
          <IndicatorIcon indicator={indicator} />
        </span>
      </div>
    </div>
  );
}
