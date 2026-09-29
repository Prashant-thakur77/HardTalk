import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { TOP } from './Face';

const PIECES = 18;
const COLORS = Object.values(TOP);

/** A one-off burst of confetti when a retry beats the last try. Nothing at all with Reduce Motion. */
export function Celebration({ reduceMotion }: { reduceMotion: boolean }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const burst = Animated.timing(progress, { toValue: 1, duration: 1600, useNativeDriver: true });
    burst.start();
    return () => burst.stop();
  }, [reduceMotion, progress]);

  if (reduceMotion) return null;
  return (
    <View style={styles.layer} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      {Array.from({ length: PIECES }, (_, index) => {
        const left = `${(index * 53) % 100}%` as const;
        const drift = ((index % 5) - 2) * 14;
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                left,
                backgroundColor: COLORS[index % COLORS.length],
                opacity: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
                transform: [
                  { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 150 + (index % 4) * 30] }) },
                  { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
                  { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${index % 2 ? 300 : -300}deg`] }) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, overflow: 'hidden' },
  piece: { position: 'absolute', top: 0, width: 8, height: 12, borderRadius: 2 },
});
