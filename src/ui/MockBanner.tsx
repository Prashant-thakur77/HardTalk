import { StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';

import { colors, radius, space } from './theme';

const DEFAULT_MESSAGE = 'Mock mode: replaying recorded conversations. No microphone, no network, no keys.';

/** Always visible in mock mode so a replay is never mistaken for a live conversation or a live grade. */
export function MockBanner({ message = DEFAULT_MESSAGE }: { message?: string }) {
  if (!config.mock) return null;
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.notice,
    borderRadius: radius,
    padding: space.sm + 4,
  },
  text: { color: colors.onNotice, fontSize: 14, lineHeight: 19, fontWeight: '500' },
});
