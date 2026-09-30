import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from './theme';

const COUNT_MS = 900;
const FRAME_MS = 30;

interface ScoreRingProps {
  score: number;
  max: number;
  /** The last try's score: drawn as a faint arc, and the ring counts up from it. */
  previous?: number;
  size?: number;
  reduceMotion?: boolean;
}

/** Total score as a ring. Decorative: the summary around it carries the numbers for screen readers. */
export function ScoreRing({ score, max, previous, size = 120, reduceMotion = false }: ScoreRingProps) {
  const start = reduceMotion ? score : (previous ?? 0);
  const [shown, setShown] = useState(start);

  useEffect(() => {
    if (reduceMotion) return;
    const began = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - began) / COUNT_MS);
      const eased = 1 - (1 - t) ** 3;
      setShown(start + (score - start) * eased);
      if (t === 1) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [score, start, reduceMotion]);

  const value = reduceMotion ? score : shown;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = (points: number) => Math.max(0, Math.min(1, points / max));
  const final = ratio(score);
  const tone = final >= 0.75 ? colors.success : final >= 0.5 ? colors.primary : colors.warning;
  const arc = (points: number, color: string, opacity = 1) => (
    <Circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={`${circumference} ${circumference}`}
      strokeDashoffset={circumference * (1 - ratio(points))}
      transform={`rotate(-90 ${size / 2} ${size / 2})`}
    />
  );
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.track} strokeWidth={stroke} fill="none" />
        {previous !== undefined && previous < score ? arc(previous, colors.textMuted, 0.35) : null}
        {arc(value, tone)}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.score}>{Math.round(value)}</Text>
        <Text style={styles.max}>of {max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 38, fontWeight: '800', color: colors.text, lineHeight: 42 },
  max: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});
