import { create } from 'zustand';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  category: string;
  label: string;
}

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  addMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 44.8176, lng: 20.4633 },
  zoom: 12,
  markers: [],

  setCenter: (lat, lng) => set({ center: { lat, lng } }),
  setZoom: (zoom) => set({ zoom }),
  addMarkers: (newMarkers) =>
    set((s) => ({
      markers: [
        ...s.markers,
        ...newMarkers.filter(
          (nm) => !s.markers.some((em) => em.id === nm.id),
        ),
      ],
    })),
  clearMarkers: () => set({ markers: [] }),
}));
