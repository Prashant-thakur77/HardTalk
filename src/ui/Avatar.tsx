import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, personaColors } from './theme';

/** Stable colour per persona name, so Sam is always Sam. */
export function personaColor(name: string): string {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return personaColors[sum % personaColors.length]!;
}

interface AvatarProps {
  name: string;
  size?: number;
  /** Pulses a ring while the persona is talking. Still when Reduce Motion is on. */
  speaking?: boolean;
  reduceMotion?: boolean;
}

export function Avatar({ name, size = 48, speaking = false, reduceMotion = false }: AvatarProps) {
  const [pulse] = useState(() => new Animated.Value(0));
  const color = personaColor(name);

  useEffect(() => {
    if (!speaking || reduceMotion) {
      pulse.setValue(speaking ? 1 : 0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, reduceMotion, pulse]);

  const ring = size + 12;
  return (
    <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }} accessible={false}>
      <Animated.View
        style={[
          styles.ring,
          { width: ring, height: ring, borderRadius: ring / 2, borderColor: color, opacity: pulse },
        ]}
      />
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 3 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.onPrimary, fontWeight: '700' },
});
