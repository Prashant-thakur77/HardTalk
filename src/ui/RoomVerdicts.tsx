import { StyleSheet, Text, View } from 'react-native';

import type { Dimension, Grade } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { reactionOf, VERDICT, type Person, type Verdict } from '@/scenarios/people';

import { Face } from './Face';
import { colors, shadow, space, type } from './theme';

const CHIP: Record<Verdict, { color: string; backgroundColor: string }> = {
  won: { color: colors.success, backgroundColor: '#EAF5EF' },
  unsure: { color: colors.text, backgroundColor: colors.track },
  unconvinced: { color: colors.warning, backgroundColor: colors.notice },
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
      {people.length > 1 ? <Text style={type.heading}>You won over {won} of {people.length}</Text> : null}
      {reactions.map(({ person, now, before }) => {
        const cares = now.basis.map((item) => rubrics[item.dimension].name);
        const basis = cares.length > 1 ? `${cares.slice(0, -1).join(', ')} and ${cares.at(-1)}` : (cares[0] ?? '');
        const changed = before && before !== now.verdict ? `, was ${VERDICT[before].label.toLowerCase()}` : '';
        return (
          <View
            key={person.name}
            style={styles.row}
            accessible
            accessibilityLabel={`${person.name}: ${VERDICT[now.verdict].label}${changed}. Cares about ${basis}.`}>
            <Face face={person.face} mood={VERDICT[now.verdict].mood} size={44} reduceMotion={reduceMotion} />
            <View style={styles.text}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{person.name}</Text>
                <Text style={[styles.chip, CHIP[now.verdict]]}>{VERDICT[now.verdict].label}</Text>
              </View>
              {changed ? (
                <Text style={type.caption}>
                  Was {VERDICT[before!].label.toLowerCase()} → {VERDICT[now.verdict].label.toLowerCase()}
                </Text>
              ) : null}
              {now.basis.length < trackRubrics.length ? <Text style={type.caption}>Cares about {basis}</Text> : null}
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
  chip: { fontSize: 14, fontWeight: '800', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: 'hidden' },
});
