import { useState, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, type Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSettingsStore } from '@/store/settings-store';
import { colors } from '@/constants/theme';

function useThemeColors() {
  const systemScheme = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  const resolved =
    theme === 'system'
      ? systemScheme ?? 'dark'
      : theme === 'dark'
        ? 'dark'
        : 'light';
  return colors[resolved];
}

interface POIMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
}

const BELGRADE_REGION: Region = {
  latitude: 44.8176,
  longitude: 20.4633,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CITY_OPTIONS: { label: string; region: Region }[] = [
  { label: 'Beograd', region: BELGRADE_REGION },
  {
    label: 'Novi Sad',
    region: {
      latitude: 45.2671,
      longitude: 19.8335,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    },
  },
];

const SAMPLE_MARKERS: POIMarker[] = [
  { id: '1', lat: 44.8176, lng: 20.4633, title: 'Centar Beograda', category: 'default' },
  { id: '2', lat: 44.7937, lng: 20.4754, title: 'Vračar', category: 'neighborhood' },
  { id: '3', lat: 44.8228, lng: 20.4628, title: 'Dorćol', category: 'neighborhood' },
  { id: '4', lat: 45.2671, lng: 19.8335, title: 'Centar Novog Sada', category: 'default' },
  { id: '5', lat: 45.2441, lng: 19.8275, title: 'Liman', category: 'neighborhood' },
];

const MARKER_COLORS: Record<string, string> = {
  neighborhood: '#3b82f6',
  education: '#22c55e',
  healthcare: '#ef4444',
  default: '#2dd4bf',
};

export default function MapScreen() {
  const themeColors = useThemeColors();
  const mapRef = useRef<MapView>(null);
  const [selectedCity, setSelectedCity] = useState(0);

  const styles = createStyles(themeColors);

  function handleCitySwitch(idx: number) {
    setSelectedCity(idx);
    mapRef.current?.animateToRegion(CITY_OPTIONS[idx].region, 800);
  }

  return (
    <View style={styles.container}>
      <View style={styles.citySelector}>
        {CITY_OPTIONS.map((city, idx) => (
          <TouchableOpacity
            key={city.label}
            style={[styles.cityBtn, selectedCity === idx && styles.cityBtnActive]}
            onPress={() => handleCitySwitch(idx)}
          >
            <Text style={[styles.cityBtnText, selectedCity === idx && styles.cityBtnTextActive]}>
              {city.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={BELGRADE_REGION}
        showsUserLocation
        showsMyLocationButton
        mapType={Platform.OS === 'android' ? 'standard' : 'mutedStandard'}
      >
        {SAMPLE_MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            title={marker.title}
            pinColor={MARKER_COLORS[marker.category] ?? MARKER_COLORS.default}
          />
        ))}
      </MapView>
    </View>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    citySelector: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: c.bgSecondary,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    cityBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    cityBtnActive: {
      borderColor: c.accent,
      backgroundColor: c.accentMuted,
    },
    cityBtnText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    cityBtnTextActive: {
      color: c.accent,
      fontWeight: '600',
    },
    map: {
      flex: 1,
    },
  });
}
