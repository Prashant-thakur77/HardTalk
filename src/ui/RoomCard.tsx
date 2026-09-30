import { StyleSheet, Text, View } from 'react-native';

import { STANCE_LABEL, type Person } from '@/scenarios/people';

import { Face } from './Face';
import { colors, shadow, space, type } from './theme';

/** A pill like the scorecard's verdict chips: green on your side, amber questioning, grey otherwise. */
const STANCE_CHIP = {
  lead: { color: colors.textMuted, backgroundColor: colors.track },
  agrees: { color: colors.success, backgroundColor: '#EAF5EF' },
  questions: { color: colors.warning, backgroundColor: colors.notice },
  neutral: { color: colors.textMuted, backgroundColor: colors.track },
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
            <Text style={[styles.stance, STANCE_CHIP[person.stance]]}>{STANCE_LABEL[person.stance]}</Text>
            {person.asksAbout.length > 0 ? (
              <Text style={styles.asks} accessibilityLabel={`${person.name} will ask about: ${person.asksAbout.join(', ')}`}>
                <Text style={styles.asksLabel}>Asks about: </Text>
                {person.asksAbout.join(' · ')}
              </Text>
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
  stance: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginVertical: 2,
    overflow: 'hidden',
  },
  asks: { fontSize: 14, lineHeight: 20, color: colors.text },
  asksLabel: { fontWeight: '700' },
});
