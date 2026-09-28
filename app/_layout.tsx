import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'HardTalk' }} />
        <Stack.Screen name="scenario/[id]" options={{ title: 'Get ready' }} />
        <Stack.Screen
          name="session/[id]"
          options={{ title: 'Conversation', headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="scorecard/[attemptId]" options={{ title: 'Scorecard', headerBackVisible: false }} />
      </Stack>
    </>
  );
}
