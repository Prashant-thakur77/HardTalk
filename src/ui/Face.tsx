import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Face as FaceTraits, Mood } from '@/scenarios/schema';

const SKIN: Record<FaceTraits['skin'], string> = {
  porcelain: '#F6DCC9',
  light: '#EDC3A0',
  tan: '#D29B6C',
  olive: '#B98A5E',
  brown: '#8D5A3B',
  deep: '#5A3825',
};

const HAIR: Record<FaceTraits['hair'], string> = {
  black: '#1F1A17',
  dark_brown: '#3B2A20',
  brown: '#6B4A2F',
  auburn: '#8E3B1F',
  blonde: '#D8B25A',
  grey: '#9A9A9A',
  white: '#E6E6E6',
};

export const TOP: Record<FaceTraits['top'], string> = {
  blue: '#2445C8',
  green: '#12703F',
  amber: '#B8741A',
  purple: '#6B2FA3',
  red: '#B42318',
  teal: '#0F766E',
  charcoal: '#3A3F4B',
};

const FEATURE = '#2A1E1A';
const MOUTH = '#8C2F2B';

/** Hair drawn behind the head: the length that shows past the ears. */
function HairBack({ style, color }: { style: FaceTraits['hair_style']; color: string }) {
  switch (style) {
    case 'afro':
      return <Circle cx={50} cy={40} r={31} fill={color} />;
    case 'long':
      return <Path d="M26 44 C24 20 40 12 50 12 C62 12 76 20 74 44 L76 78 L24 78 Z" fill={color} />;
    case 'bob':
      return <Path d="M26 46 C24 20 40 13 50 13 C62 13 76 20 74 46 L74 62 L26 62 Z" fill={color} />;
    case 'bun':
      return <Circle cx={50} cy={14} r={9} fill={color} />;
    case 'ponytail':
      return <Path d="M66 30 C82 34 84 56 76 70 C74 58 72 46 64 38 Z" fill={color} />;
    default:
      return null;
  }
}

/** Hair drawn over the top of the head. */
function HairFront({ style, color }: { style: FaceTraits['hair_style']; color: string }) {
  switch (style) {
    case 'bald':
      return <Path d="M30 44 C30 40 31 38 32 37 L32 44 Z M70 44 C70 40 69 38 68 37 L68 44 Z" fill={color} />;
    case 'crop':
      return <Path d="M31 38 C31 24 41 19 50 19 C60 19 69 24 69 38 C63 31 57 28 50 28 C43 28 37 31 31 38 Z" fill={color} />;
    case 'curly':
      return (
        <G fill={color}>
          {[32, 39, 46, 53, 60, 67].map((x, i) => (
            <Circle key={x} cx={x} cy={i % 2 ? 22 : 26} r={7} />
          ))}
          <Circle cx={30} cy={34} r={5} />
          <Circle cx={70} cy={34} r={5} />
        </G>
      );
    case 'afro':
      return <Path d="M30 36 C32 26 40 22 50 22 C60 22 68 26 70 36 C62 31 56 30 50 30 C44 30 38 31 30 36 Z" fill={color} />;
    case 'long':
    case 'bob':
      return <Path d="M29 44 C28 24 40 18 50 18 C60 18 72 24 71 44 C66 32 56 27 44 30 C38 32 32 37 29 44 Z" fill={color} />;
    default:
      return <Path d="M30 40 C30 22 42 16 52 17 C64 18 71 26 70 40 C66 32 58 28 50 28 C42 28 34 32 30 40 Z" fill={color} />;
  }
}

function Brows({ mood, color }: { mood: Mood; color: string }) {
  const [left, right] = {
    friendly: ['M37 38 Q42 35 47 37', 'M53 37 Q58 35 63 38'],
    pleased: ['M37 37 Q42 33 47 36', 'M53 36 Q58 33 63 37'],
    neutral: ['M37 38 L47 38', 'M53 38 L63 38'],
    skeptical: ['M37 39 L47 39', 'M53 36 Q58 33 63 37'],
    stern: ['M37 36 L47 40', 'M53 40 L63 36'],
  }[mood];
  return (
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none">
      <Path d={left} />
      <Path d={right} />
    </G>
  );
}

function Mouth({ mood, open }: { mood: Mood; open: boolean }) {
  if (open) return <Ellipse cx={50} cy={61} rx={5} ry={3.6} fill={MOUTH} />;
  const d = {
    friendly: 'M43 59 Q50 65 57 59',
    pleased: 'M42 58 Q50 67 58 58',
    neutral: 'M44 61 L56 61',
    skeptical: 'M44 62 Q51 60 57 58',
    stern: 'M43 63 Q50 58 57 63',
  }[mood];
  return <Path d={d} stroke={MOUTH} strokeWidth={2.6} strokeLinecap="round" fill={mood === 'pleased' ? '#FFFFFF' : 'none'} />;
}

interface FaceProps {
  face: FaceTraits;
  mood?: Mood;
  size?: number;
  /** Talks and shows a pulsing ring while this person is speaking. */
  speaking?: boolean;
  /** Stills every animation: no blinking, talking or pulsing. */
  reduceMotion?: boolean;
}

/**
 * A drawn persona face. Decorative: the name and role are always in text next to it, so it is
 * hidden from screen readers. It blinks now and then, and its mouth moves while it speaks.
 */
export function Face({ face, mood = 'neutral', size = 48, speaking = false, reduceMotion = false }: FaceProps) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));
  const top = TOP[face.top];

  useEffect(() => {
    if (reduceMotion) return;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setBlink(true);
      reopen = setTimeout(() => setBlink(false), 140);
    }, 3200 + (face.skin.length + face.hair.length) * 90);
    return () => {
      clearInterval(timer);
      clearTimeout(reopen);
    };
  }, [reduceMotion, face.skin, face.hair]);

  useEffect(() => {
    if (!speaking || reduceMotion) return;
    const timer = setInterval(() => setMouthOpen((open) => !open), 170);
    return () => clearInterval(timer);
  }, [speaking, reduceMotion]);

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

  const skin = SKIN[face.skin];
  const hair = HAIR[face.hair];
  const ring = size + 10;
  return (
    <View
      style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2, borderColor: top, opacity: pulse }]}
      />
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={50} fill="#E9EDF9" />
        <G>
          <HairBack style={face.hair_style} color={hair} />
          <Path d="M14 104 C14 80 34 72 50 72 C66 72 86 80 86 104 Z" fill={top} />
          <Rect x={43} y={60} width={14} height={14} rx={4} fill={skin} />
          <Path d="M43 72 L50 80 L57 72" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} fill="none" />
          <Circle cx={30} cy={47} r={4.5} fill={skin} />
          <Circle cx={70} cy={47} r={4.5} fill={skin} />
          {face.earrings ? (
            <G fill="#E3B341">
              <Circle cx={30} cy={54} r={2} />
              <Circle cx={70} cy={54} r={2} />
            </G>
          ) : null}
          <Ellipse cx={50} cy={45} rx={20} ry={23} fill={skin} />
          {face.beard ? (
            <Path d="M31 50 C32 64 40 70 50 70 C60 70 68 64 69 50 C66 58 60 60 50 60 C40 60 34 58 31 50 Z" fill={hair} />
          ) : null}
          <HairFront style={face.hair_style} color={hair} />
          <Brows mood={mood} color={face.hair === 'white' || face.hair === 'grey' ? '#6F6F6F' : hair} />
          {blink && !reduceMotion ? (
            <G stroke={FEATURE} strokeWidth={2} strokeLinecap="round">
              <Line x1={39} y1={46} x2={45} y2={46} />
              <Line x1={55} y1={46} x2={61} y2={46} />
            </G>
          ) : (
            <G>
              <Ellipse cx={42} cy={46} rx={3.6} ry={3.2} fill="#FFFFFF" />
              <Ellipse cx={58} cy={46} rx={3.6} ry={3.2} fill="#FFFFFF" />
              <Circle cx={42.4} cy={46.4} r={2} fill={FEATURE} />
              <Circle cx={58.4} cy={46.4} r={2} fill={FEATURE} />
            </G>
          )}
          {face.glasses ? (
            <G stroke={FEATURE} strokeWidth={1.6} fill="none">
              <Circle cx={42} cy={46} r={6.5} />
              <Circle cx={58} cy={46} r={6.5} />
              <Line x1={48.5} y1={46} x2={51.5} y2={46} />
            </G>
          ) : null}
          {mood === 'pleased' ? (
            <G fill="#E0707A" opacity={0.35}>
              <Circle cx={36} cy={55} r={3.5} />
              <Circle cx={64} cy={55} r={3.5} />
            </G>
          ) : null}
          <Mouth mood={mood} open={speaking && !reduceMotion && mouthOpen} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 3 },
});
