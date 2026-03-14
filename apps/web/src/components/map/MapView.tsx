'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore, type MapMarker } from '@/store/map-store';
import styles from './MapView.module.css';

const CATEGORY_COLORS: Record<string, string> = {
  education: '#3b82f6',
  healthcare: '#ef4444',
  shopping: '#f59e0b',
  transport: '#8b5cf6',
  greenery: '#22c55e',
  safety: '#06b6d4',
  default: '#2dd4bf',
};

function markerColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const markers = useMapStore((s) => s.markers);

  /* Initialise map */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync center/zoom from store */
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom, duration: 1200 });
  }, [center, zoom]);

  /* Sync markers */
  useEffect(() => {
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    if (!mapRef.current) return;

    markers.forEach((mk: MapMarker) => {
      const el = document.createElement('div');
      el.className = styles.marker;
      el.style.setProperty('--marker-color', markerColor(mk.category));
      el.title = mk.label;

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([mk.lng, mk.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
            `<div class="${styles.popup}"><strong>${mk.label}</strong><span>${mk.category}</span></div>`,
          ),
        )
        .addTo(mapRef.current!);

      markerRefs.current.push(m);
    });
  }, [markers]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapContainer} className={styles.map} />
    </div>
  );
}
