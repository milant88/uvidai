'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { NeighborhoodDNA } from '@/components/ui/NeighborhoodDNA';
import { MetricRow, type ComparisonIndicator } from './MetricRow';
import styles from './ComparisonCard.module.css';

export interface ComparisonLocation {
  address: string;
  lat: number;
  lng: number;
  neighborhoodScore?: {
    overall: number;
    categories: {
      education: number;
      healthcare: number;
      shopping: number;
      transport: number;
      greenery: number;
      safety: number;
    };
  };
  aqi?: number;
  walkabilityScore?: number;
  schoolCount?: number;
  pricePerSqm?: number;
}

interface MetricConfig {
  label: string;
  value: string | number;
  indicator: ComparisonIndicator;
}

interface ComparisonCardProps {
  location: ComparisonLocation;
  metrics: MetricConfig[];
}

export function ComparisonCard({ location, metrics }: ComparisonCardProps) {
  const categories = location.neighborhoodScore?.categories ?? {
    education: 0,
    healthcare: 0,
    shopping: 0,
    transport: 0,
    greenery: 0,
    safety: 0,
  };

  return (
    <GlassCard className={styles.card}>
      <h3 className={styles.header}>{location.address}</h3>
      <div className={styles.chartWrapper}>
        <NeighborhoodDNA scores={categories} />
      </div>
      <div className={styles.metrics}>
        {metrics.map((m) => (
          <MetricRow key={m.label} label={m.label} value={m.value} indicator={m.indicator} />
        ))}
      </div>
    </GlassCard>
  );
}
