import { StyleSheet, Text, View } from 'react-native';

import type { Dimension, Grade } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { reactionOf, VERDICT, type Person, type Verdict } from '@/scenarios/people';

import { Face } from './Face';
import { colors, shadow, space, type } from './theme';

const TONE: Record<Verdict, string> = {
  won: colors.success,
  unsure: colors.textMuted,
  unconvinced: colors.warning,
};

interface RoomVerdictsProps {
  people: Person[];
  grade: Grade;
  /** The last try at this level, so a change of mind shows. */
  previous?: Grade;
  trackRubrics: Dimension[];
  reduceMotion: boolean;
}

/**
 * Who you won over. Each person judges only the skills they care about, so the verdicts come
 * straight from the evidence-checked scores and never contradict the cards below.
 */
export function RoomVerdicts({ people, grade, previous, trackRubrics, reduceMotion }: RoomVerdictsProps) {
  const reactions = people.map((person) => ({
    person,
    now: reactionOf(person, grade, trackRubrics),
    before: previous && reactionOf(person, previous, trackRubrics).verdict,
  }));
  const won = reactions.filter((reaction) => reaction.now.verdict === 'won').length;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>How the room took it</Text>
      <Text style={type.heading}>
        {people.length === 1
          ? `${people[0]!.name}: ${VERDICT[reactions[0]!.now.verdict].label.toLowerCase()}`
          : `You won over ${won} of ${people.length}`}
      </Text>
      {reactions.map(({ person, now, before }) => {
        const basis = now.basis.map((item) => `${rubrics[item.dimension].name} ${item.score}/4`).join(', ');
        const changed = before && before !== now.verdict ? `, was ${VERDICT[before].label.toLowerCase()}` : '';
        return (
          <View
            key={person.name}
            style={styles.row}
            accessible
            accessibilityLabel={`${person.name}: ${VERDICT[now.verdict].label}${changed}. Judges ${basis}.`}>
            <Face face={person.face} mood={VERDICT[now.verdict].mood} size={44} reduceMotion={reduceMotion} />
            <View style={styles.text}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{person.name}</Text>
                <Text style={[styles.verdict, { color: TONE[now.verdict] }]}>{VERDICT[now.verdict].label}</Text>
              </View>
              <Text style={type.caption}>
                Judges {basis}
                {changed ? ` · was ${VERDICT[before!].label.toLowerCase()}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    ...shadow,
  },
  label: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  text: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  verdict: { fontSize: 15, fontWeight: '800' },
});
