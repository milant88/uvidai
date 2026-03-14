import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/store/settings-store';
import { colors } from '@/constants/theme';

const queryClient = new QueryClient();

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

function RootLayoutContent() {
  const themeColors = useThemeColors();

  return (
    <>
      <StatusBar style={themeColors.bg === '#0a1628' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.bg },
          headerTintColor: themeColors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: themeColors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="tourist"
          options={{
            title: 'Turistički Vodič',
            headerBackTitle: 'Nazad',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
    </QueryClientProvider>
  );
}
