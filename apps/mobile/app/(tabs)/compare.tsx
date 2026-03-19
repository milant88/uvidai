import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
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

interface LocationData {
  name: string;
  aqi: number;
  walkability: number;
  schools: number;
  pricePerSqm: number;
  greenSpaces: number;
  transitScore: number;
}

const LOCATIONS: LocationData[] = [
  { name: 'Vračar', aqi: 62, walkability: 85, schools: 12, pricePerSqm: 2800, greenSpaces: 4, transitScore: 88 },
  { name: 'Dorćol', aqi: 58, walkability: 92, schools: 8, pricePerSqm: 3200, greenSpaces: 3, transitScore: 90 },
  { name: 'Novi Beograd', aqi: 55, walkability: 72, schools: 18, pricePerSqm: 2200, greenSpaces: 8, transitScore: 82 },
  { name: 'Liman', aqi: 48, walkability: 78, schools: 6, pricePerSqm: 1600, greenSpaces: 5, transitScore: 75 },
  { name: 'Grbavica', aqi: 50, walkability: 74, schools: 5, pricePerSqm: 1500, greenSpaces: 4, transitScore: 72 },
  { name: 'Zemun', aqi: 60, walkability: 68, schools: 10, pricePerSqm: 1800, greenSpaces: 6, transitScore: 70 },
];

const METRICS: { key: keyof LocationData; label: string; unit: string; lowerBetter: boolean }[] = [
  { key: 'aqi', label: 'AQI', unit: '', lowerBetter: true },
  { key: 'walkability', label: 'Prohodnost', unit: '/100', lowerBetter: false },
  { key: 'schools', label: 'Škole', unit: '', lowerBetter: false },
  { key: 'pricePerSqm', label: 'Cena/m²', unit: ' €', lowerBetter: true },
  { key: 'greenSpaces', label: 'Parkovi', unit: '', lowerBetter: false },
  { key: 'transitScore', label: 'Transport', unit: '/100', lowerBetter: false },
];

export default function CompareScreen() {
  const themeColors = useThemeColors();
  const [locA, setLocA] = useState<number | null>(null);
  const [locB, setLocB] = useState<number | null>(null);
  const [selecting, setSelecting] = useState<'A' | 'B' | null>(null);

  const styles = createStyles(themeColors);

  const dataA = locA !== null ? LOCATIONS[locA] : null;
  const dataB = locB !== null ? LOCATIONS[locB] : null;

  function handleSelect(idx: number) {
    if (selecting === 'A') {
      setLocA(idx);
    } else if (selecting === 'B') {
      setLocB(idx);
    }
    setSelecting(null);
  }

  function indicator(metric: typeof METRICS[0], a: number, b: number): 'better' | 'worse' | 'equal' {
    if (a === b) return 'equal';
    const aBetter = metric.lowerBetter ? a < b : a > b;
    return aBetter ? 'better' : 'worse';
  }

  if (selecting) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Izaberi lokaciju {selecting}</Text>
        <ScrollView style={styles.locationList}>
          {LOCATIONS.map((loc, idx) => (
            <TouchableOpacity
              key={loc.name}
              style={styles.locationItem}
              onPress={() => handleSelect(idx)}
            >
              <Text style={styles.locationName}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelecting(null)}>
          <Text style={styles.cancelText}>Otkaži</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Uporedi lokacije</Text>

      <View style={styles.slots}>
        <TouchableOpacity
          style={[styles.slot, locA !== null && styles.slotFilled]}
          onPress={() => setSelecting('A')}
        >
          <Text style={styles.slotLabel}>
            {dataA ? dataA.name : '+ Lokacija A'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.vs}>vs</Text>

        <TouchableOpacity
          style={[styles.slot, locB !== null && styles.slotFilled]}
          onPress={() => setSelecting('B')}
        >
          <Text style={styles.slotLabel}>
            {dataB ? dataB.name : '+ Lokacija B'}
          </Text>
        </TouchableOpacity>
      </View>

      {dataA && dataB && (
        <View style={styles.metricsTable}>
          {METRICS.map((metric) => {
            const valA = dataA[metric.key] as number;
            const valB = dataB[metric.key] as number;
            const indA = indicator(metric, valA, valB);
            const indB = indicator(metric, valB, valA);

            return (
              <View key={metric.key} style={styles.metricRow}>
                <View style={styles.metricCell}>
                  <Text style={[
                    styles.metricValue,
                    indA === 'better' && styles.better,
                    indA === 'worse' && styles.worse,
                  ]}>
                    {valA}{metric.unit}
                  </Text>
                </View>
                <View style={styles.metricLabelCell}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={[
                    styles.metricValue,
                    indB === 'better' && styles.better,
                    indB === 'worse' && styles.worse,
                  ]}>
                    {valB}{metric.unit}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {(!dataA || !dataB) && (
        <Text style={styles.hint}>Izaberite dve lokacije za uporedni prikaz</Text>
      )}
    </ScrollView>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 20,
    },
    slots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    slot: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.border,
      alignItems: 'center',
      backgroundColor: c.bgSecondary,
    },
    slotFilled: {
      borderStyle: 'solid',
      borderColor: c.accent,
      backgroundColor: c.accentMuted,
    },
    slotLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textSecondary,
    },
    vs: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    metricsTable: {
      gap: 2,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    metricCell: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabelCell: {
      width: 90,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
    better: {
      color: '#22c55e',
    },
    worse: {
      color: '#ef4444',
    },
    hint: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 40,
    },
    locationList: {
      flex: 1,
    },
    locationItem: {
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgSecondary,
      marginBottom: 8,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '500',
      color: c.textPrimary,
    },
    cancelBtn: {
      padding: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    cancelText: {
      fontSize: 15,
      color: c.textMuted,
    },
  });
}
