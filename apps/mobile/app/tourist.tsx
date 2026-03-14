import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
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

export default function TouristScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Turistički Vodič</Text>
      <Text style={styles.subtitle}>Tourist Guide</Text>

      <Text style={styles.description}>
        Istražite Beograd i Novi Sad sa AI vodičem. Otkrijte restorane, skrivene
        dragulje i istorijske znamenitosti.
      </Text>

      <TouchableOpacity style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Pokreni šetnju</Text>
      </TouchableOpacity>

      <View style={styles.quickLinks}>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkIcon}>🍽️</Text>
          <Text style={styles.linkText}>Restorani</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkIcon}>💎</Text>
          <Text style={styles.linkText}>Skriveni dragulji</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkIcon}>🏛️</Text>
          <Text style={styles.linkText}>Istorijske znamenitosti</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 24,
    },
    description: {
      fontSize: 16,
      color: c.textSecondary,
      lineHeight: 24,
      marginBottom: 32,
    },
    primaryBtn: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: c.accent,
      alignItems: 'center',
      marginBottom: 32,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.bg,
    },
    quickLinks: {
      gap: 12,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgSecondary,
    },
    linkIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    linkText: {
      fontSize: 16,
      color: c.textPrimary,
    },
  });
}
