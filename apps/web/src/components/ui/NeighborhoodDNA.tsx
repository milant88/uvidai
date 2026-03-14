'use client';

import { useMemo } from 'react';
import styles from './NeighborhoodDNA.module.css';

interface NeighborhoodDNAProps {
  scores: {
    education: number;
    healthcare: number;
    shopping: number;
    transport: number;
    greenery: number;
    safety: number;
  };
  className?: string;
}

const AXES: { key: keyof NeighborhoodDNAProps['scores']; label: string }[] = [
  { key: 'education', label: 'Obrazovanje' },
  { key: 'healthcare', label: 'Zdravstvo' },
  { key: 'shopping', label: 'Kupovina' },
  { key: 'transport', label: 'Transport' },
  { key: 'greenery', label: 'Zelenilo' },
  { key: 'safety', label: 'Bezbednost' },
];

const CX = 100;
const CY = 100;
const R = 72;
const LABEL_R = 92;
const LEVELS = 4;

function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

export function NeighborhoodDNA({
  scores,
  className = '',
}: NeighborhoodDNAProps) {
  const angleStep = 360 / AXES.length;

  const overall = useMemo(() => {
    const vals = AXES.map((a) => scores[a.key]);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [scores]);

  const gridRings = useMemo(() => {
    return Array.from({ length: LEVELS }, (_, i) => {
      const r = (R / LEVELS) * (i + 1);
      const points = AXES.map((_, j) => {
        const { x, y } = polarToXY(j * angleStep, r);
        return `${x},${y}`;
      }).join(' ');
      return points;
    });
  }, [angleStep]);

  const dataPoints = useMemo(() => {
    return AXES.map((a, i) => {
      const val = Math.min(100, Math.max(0, scores[a.key]));
      const r = (val / 100) * R;
      return polarToXY(i * angleStep, r);
    });
  }, [scores, angleStep]);

  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <svg viewBox="0 0 200 200" className={styles.svg}>
        {/* Grid rings */}
        {gridRings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            className={styles.ring}
            style={{ opacity: 0.15 + i * 0.1 }}
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const { x, y } = polarToXY(i * angleStep, R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              className={styles.axisLine}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          className={styles.data}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            className={styles.dataPoint}
          />
        ))}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const { x, y } = polarToXY(i * angleStep, LABEL_R);
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.label}
            >
              {axis.label}
            </text>
          );
        })}

        {/* Center score */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className={styles.scoreValue}
        >
          {overall}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          className={styles.scoreLabel}
        >
          ukupno
        </text>
      </svg>
    </div>
  );
}
