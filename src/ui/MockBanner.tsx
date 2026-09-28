import { StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';

import { colors, radius, space } from './theme';

/** Always visible in mock mode so a replayed conversation is never mistaken for a live one. */
export function MockBanner() {
  if (!config.mock) return null;
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>
        Mock mode: replaying recorded conversations. No microphone, no network, no keys.
      </Text>
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
