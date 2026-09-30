import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { loadPreferences } from '@/a11y/preferences';
import { loadOutcomes } from '@/attempts/outcomes';
import { loadAttempts } from '@/attempts/store';
import { initPurchases } from '@/purchases';
import { loadCustomScenarios } from '@/scenarios/custom';
import { colors } from '@/ui/theme';

/** Screens you leave with their own buttons, never by backing into a finished session. */
const noBack = { headerBackVisible: false, headerLeft: () => null } as const;

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.allSettled([loadAttempts(), loadOutcomes(), loadCustomScenarios(), loadPreferences(), initPurchases()]).then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'HardTalk' }} />
        <Stack.Screen name="scenario/[id]" options={{ title: 'Get ready' }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Conversation', ...noBack, gestureEnabled: false }} />
        <Stack.Screen name="scorecard/[attemptId]" options={{ title: 'Scorecard', ...noBack }} />
        <Stack.Screen name="paywall" options={{ title: 'HardTalk Pro', presentation: 'modal' }} />
        <Stack.Screen name="history" options={{ title: 'Your progress' }} />
        <Stack.Screen name="custom/new" options={{ title: 'Your own scenario' }} />
        <Stack.Screen name="support" options={{ title: 'Take a moment', ...noBack }} />
      </Stack>
    </>
  );
}
