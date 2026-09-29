import { StyleSheet, Text, View } from 'react-native';

import type { Mood } from '@/scenarios/schema';
import type { Person } from '@/scenarios/people';

import { Face } from './Face';
import { colors, space } from './theme';

interface RoomProps {
  people: Person[];
  /** Who is talking right now, by name. */
  speaking?: string | null;
  /** Everyone shows this expression instead of their own, such as on the scorecard. */
  mood?: Mood;
  size?: number;
  reduceMotion?: boolean;
}

/** Everyone in the conversation, side by side, with the speaker animated. Names are in text. */
export function Room({ people, speaking = null, mood, size = 56, reduceMotion = false }: RoomProps) {
  return (
    <View style={styles.row}>
      {people.map((person, index) => (
        <View key={person.name} style={styles.person}>
          <Face
            face={person.face}
            mood={mood ?? person.mood}
            size={index === 0 ? size : Math.round(size * 0.82)}
            speaking={speaking === person.name}
            reduceMotion={reduceMotion}
          />
          <Text style={[styles.name, speaking === person.name && styles.speaking]} numberOfLines={1}>
            {person.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  person: { alignItems: 'center', gap: 2 },
  name: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  speaking: { color: colors.primary, fontWeight: '800' },
});
