import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore, type Locale, type Theme } from '@/store/settings-store';
import { colors } from '@/constants/theme';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'sr-Latn', label: 'Srpski (latinica)' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'dark', label: 'Tamno' },
  { value: 'light', label: 'Svetlo' },
];

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

export default function ProfileScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const locale = useSettingsStore((s) => s.locale);
  const theme = useSettingsStore((s) => s.theme);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const styles = createStyles(themeColors);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jezik</Text>
        <View style={styles.options}>
          {LOCALES.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.option,
                locale === value && styles.optionActive,
              ]}
              onPress={() => setLocale(value)}
            >
              <Text
                style={[
                  styles.optionText,
                  locale === value && styles.optionTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tema</Text>
        <View style={styles.options}>
          {THEMES.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.option,
                theme === value && styles.optionActive,
              ]}
              onPress={() => setTheme(value)}
            >
              <Text
                style={[
                  styles.optionText,
                  theme === value && styles.optionTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.touristBtn}
        onPress={() => router.push('/tourist')}
      >
        <Text style={styles.touristBtnText}>Turistički vodič</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.version}>UvidAI v0.1.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Odjavi se</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: c.textMuted,
      marginBottom: 12,
    },
    options: {
      gap: 8,
    },
    option: {
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgSecondary,
    },
    optionActive: {
      borderColor: c.accent,
      backgroundColor: c.accentMuted,
    },
    optionText: {
      fontSize: 15,
      color: c.textSecondary,
    },
    optionTextActive: {
      color: c.accent,
      fontWeight: '500',
    },
    touristBtn: {
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentMuted,
      alignItems: 'center',
      marginBottom: 24,
    },
    touristBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.accent,
    },
    version: {
      fontSize: 13,
      color: c.textMuted,
    },
    logoutBtn: {
      marginTop: 24,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    logoutText: {
      fontSize: 15,
      color: c.textSecondary,
    },
  });
}
