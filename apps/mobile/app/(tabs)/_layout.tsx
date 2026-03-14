import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

export default function TabLayout() {
  const themeColors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: themeColors.bg },
        headerTintColor: themeColors.textPrimary,
        tabBarStyle: { backgroundColor: themeColors.bgSecondary },
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: 'Uporedi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-compare" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
