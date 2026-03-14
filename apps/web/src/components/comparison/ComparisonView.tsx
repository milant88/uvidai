'use client';

import { ComparisonCard, type ComparisonLocation } from './ComparisonCard';

export type { ComparisonLocation };
import type { ComparisonIndicator } from './MetricRow';
import styles from './ComparisonView.module.css';

interface ComparisonViewProps {
  locationA?: ComparisonLocation | null;
  locationB?: ComparisonLocation | null;
  onAddLocation?: () => void;
}

function computeIndicator(
  valA: number | undefined,
  valB: number | undefined,
  higherIsBetter: boolean
): ComparisonIndicator {
  if (valA == null || valB == null) return 'neutral';
  if (valA === valB) return 'neutral';
  const aBetter = higherIsBetter ? valA > valB : valA < valB;
  return aBetter ? 'better' : 'worse';
}

function buildMetrics(
  loc: ComparisonLocation,
  other: ComparisonLocation | null | undefined,
  index: 0 | 1
): { label: string; value: string | number; indicator: ComparisonIndicator }[] {
  const a = index === 0 ? loc : other;
  const b = index === 0 ? other : loc;
  if (!a) return [];

  const aqiA = a?.aqi;
  const aqiB = b?.aqi;
  const walkA = a?.walkabilityScore;
  const walkB = b?.walkabilityScore;
  const schoolA = a?.schoolCount;
  const schoolB = b?.schoolCount;
  const priceA = a?.pricePerSqm;
  const priceB = b?.pricePerSqm;

  return [
    {
      label: 'AQI',
      value: aqiA != null ? aqiA : '—',
      indicator: computeIndicator(aqiA, aqiB, false),
    },
    {
      label: 'Walkability',
      value: walkA != null ? walkA : '—',
      indicator: computeIndicator(walkA, walkB, true),
    },
    {
      label: 'Škole u blizini',
      value: schoolA != null ? schoolA : '—',
      indicator: computeIndicator(schoolA, schoolB, true),
    },
    {
      label: 'Cena/m²',
      value: priceA != null ? `${priceA} €` : '—',
      indicator: computeIndicator(priceA, priceB, false),
    },
  ];
}

export function ComparisonView({ locationA, locationB, onAddLocation }: ComparisonViewProps) {
  const hasA = !!locationA;
  const hasB = !!locationB;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.header}>Uporedi Lokacije</h2>
      <div className={styles.cards}>
        <div className={styles.cardSlot}>
          {hasA ? (
            <ComparisonCard
              location={locationA}
              metrics={buildMetrics(locationA, locationB, 0)}
            />
          ) : (
            <button
              type="button"
              className={styles.addButton}
              onClick={onAddLocation}
              aria-label="Dodaj lokaciju"
            >
              <svg
                className={styles.addButtonIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Dodaj lokaciju
            </button>
          )}
        </div>
        <div className={styles.cardSlot}>
          {hasB ? (
            <ComparisonCard
              location={locationB}
              metrics={buildMetrics(locationB, locationA, 1)}
            />
          ) : (
            <button
              type="button"
              className={styles.addButton}
              onClick={onAddLocation}
              aria-label="Dodaj lokaciju"
            >
              <svg
                className={styles.addButtonIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Dodaj lokaciju
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
