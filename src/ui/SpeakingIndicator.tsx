import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from './theme';

/** Three bars that move while someone is talking; still when Reduce Motion is on. */
export function SpeakingIndicator({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const [bars] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.35)));

  useEffect(() => {
    if (!active || reduceMotion) {
      bars.forEach((bar) => bar.setValue(active ? 0.8 : 0.35));
      return;
    }
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(bar, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.35, duration: 280, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, reduceMotion, bars]);

  return (
    <View style={styles.row} accessible={false}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 18 },
  bar: { width: 4, height: 18, borderRadius: 2, backgroundColor: colors.primary },
});
