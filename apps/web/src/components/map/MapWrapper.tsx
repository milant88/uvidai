'use client';

import dynamic from 'next/dynamic';
import styles from './MapWrapper.module.css';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Učitavanje mape&hellip;</span>
    </div>
  ),
});

export function MapWrapper() {
  return <MapView />;
}
