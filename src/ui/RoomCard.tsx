import { StyleSheet, Text, View } from 'react-native';

import { STANCE_LABEL, type Person } from '@/scenarios/people';

import { Face } from './Face';
import { colors, shadow, space, type } from './theme';

/** Green for someone on your side, amber for someone who will question you, grey otherwise. */
const STANCE_COLOR = {
  lead: { color: colors.textMuted },
  agrees: { color: colors.success },
  questions: { color: colors.warning },
  neutral: { color: colors.textMuted },
} as const;

/** Who is in the room, whose side they are on, and what each will ask about. */
export function RoomCard({ people, reduceMotion }: { people: Person[]; reduceMotion: boolean }) {
  return (
    <View style={styles.room}>
      <Text style={styles.label} accessibilityRole="header">
        Who’s in the room, and what they’ll ask
      </Text>
      {people.map((person) => (
        <View key={person.name} style={styles.person}>
          <Face face={person.face} mood={person.mood} size={52} reduceMotion={reduceMotion} />
          <View style={styles.personText}>
            <Text style={styles.personName}>{person.name}</Text>
            <Text style={type.caption}>{person.role}</Text>
            <Text style={[styles.stance, STANCE_COLOR[person.stance]]}>{STANCE_LABEL[person.stance]}</Text>
            {person.asksAbout.length > 0 ? (
              <View
                style={styles.topics}
                accessible
                accessibilityLabel={`${person.name} will ask about: ${person.asksAbout.join(', ')}`}>
                {person.asksAbout.map((topic) => (
                  <View key={topic} style={styles.topic}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    ...shadow,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  person: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  personText: { flex: 1, gap: 1 },
  personName: { fontSize: 17, fontWeight: '700', color: colors.text },
  stance: { fontSize: 13, fontWeight: '700' },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  topic: { backgroundColor: colors.track, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  topicText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
