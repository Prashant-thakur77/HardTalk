import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Person } from '@/scenarios/people';

import { Face } from './Face';
import { MicIcon } from './icons';
import { colors, space } from './theme';

interface TurnBarProps {
  /** Whose turn it is. `you` shows the microphone; `them` shows whoever is talking. */
  turn: 'you' | 'them' | 'waiting';
  label: string;
  speaker?: Person;
  reduceMotion: boolean;
}

/**
 * The one thing a voice session must make obvious: whether it is your turn to talk. Sits at the
 * bottom of the screen, in thumb and eye reach, and is a live region so screen readers hear it.
 */
export function TurnBar({ turn, label, speaker, reduceMotion }: TurnBarProps) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (turn !== 'you' || reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, reduceMotion, pulse]);

  return (
    <View style={[styles.bar, turn === 'you' && styles.yours]} accessibilityLiveRegion="polite">
      {turn === 'you' ? (
        <View style={styles.micWrap}>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
              },
            ]}
          />
          <View style={styles.mic}>
            <MicIcon color={colors.onPrimary} />
          </View>
        </View>
      ) : speaker ? (
        <Face face={speaker.face} mood={speaker.mood} size={44} speaking={turn === 'them'} reduceMotion={reduceMotion} />
      ) : null}
      <Text style={[styles.label, turn === 'you' && styles.yourLabel]}>{label}</Text>
    </View>
  );
}

const MIC = 60;

const styles = StyleSheet.create({
  bar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yours: { backgroundColor: '#EAF5EF', borderColor: colors.success },
  micWrap: { width: MIC, height: MIC, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC / 2, backgroundColor: colors.success },
  mic: {
    width: MIC,
    height: MIC,
    borderRadius: MIC / 2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  yourLabel: { color: colors.success },
});
