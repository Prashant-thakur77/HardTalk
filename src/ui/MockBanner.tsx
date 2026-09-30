import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';

import { colors, MIN_TARGET, radius, space } from './theme';

/** The pill is drawn smaller than a touch target; hitSlop makes up the 48 pt. */
const PILL = 32;

const DEFAULT_MESSAGE =
  'Mock mode: replaying recorded conversations, read aloud by your device. No microphone, no network, no keys.';

interface MockBannerProps {
  message?: string;
  /** A one-line pill that opens to the full message, for screens where space is precious. */
  compact?: boolean;
}

/** Always visible in mock mode so a replay is never mistaken for a live conversation or a live grade. */
export function MockBanner({ message = DEFAULT_MESSAGE, compact = false }: MockBannerProps) {
  const [open, setOpen] = useState(false);
  if (!config.mock) return null;
  if (compact && !open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mock replay: what this means"
        accessibilityHint="Shows how this replay differs from live mode"
        onPress={() => setOpen(true)}
        hitSlop={(MIN_TARGET - PILL) / 2}
        style={styles.pill}>
        <Text style={styles.pillText}>Mock replay ⓘ</Text>
      </Pressable>
    );
  }
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={message}
        accessibilityHint="Folds this note away"
        onPress={() => setOpen(false)}
        style={styles.banner}>
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: colors.notice,
    borderRadius: radius,
    padding: space.sm + 4,
  },
  text: { color: colors.onNotice, fontSize: 14, lineHeight: 19, fontWeight: '500' },
  pill: {
    alignSelf: 'flex-start',
    minHeight: PILL,
    justifyContent: 'center',
    paddingHorizontal: space.sm + 4,
    borderRadius: 999,
    backgroundColor: colors.notice,
  },
  pillText: { color: colors.onNotice, fontSize: 14, fontWeight: '700' },
});
