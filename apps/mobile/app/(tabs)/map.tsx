import { View, Text, StyleSheet, useColorScheme } from 'react-native';
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

export default function MapScreen() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Mapa uskoro</Text>
      <Text style={styles.subtitle}>Map coming soon</Text>
    </View>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    placeholder: {
      fontSize: 20,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: c.textMuted,
    },
  });
}
