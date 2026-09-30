import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { outcomeLabel, useOutcomes } from '@/attempts/outcomes';
import { useAttempts } from '@/attempts/store';
import { MAX_TOTAL, scoredDimensions, totalScore as total } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { usePro } from '@/purchases';
import { getScenario } from '@/scenarios';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { SkillBar } from '@/ui/SkillBar';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

/**
 * Progress history (Pro): every graded attempt, grouped by conversation, oldest first, with
 * each skill's first score against its latest, so the growth is visible at a glance.
 */
export default function History() {
  const pro = usePro();
  const attempts = useAttempts();
  const outcomes = useOutcomes();
  if (!pro) return <Redirect href="/" />;

  const byScenario = [...new Set(attempts.map((attempt) => attempt.scenarioId))];

  return (
    <Screen>
      {byScenario.length === 0 ? (
        <View style={styles.card}>
          <Text style={type.body}>No graded conversations yet. Your first scorecard will show up here.</Text>
          <Button label="Pick a conversation" onPress={() => router.dismissTo('/')} />
        </View>
      ) : null}
      {byScenario.map((scenarioId) => {
        const list = attempts.filter((attempt) => attempt.scenarioId === scenarioId);
        const firstGrade = list[0]!.grade;
        const latestGrade = list.at(-1)!.grade;
        const first = total(firstGrade);
        const latest = total(latestGrade);
        return (
          <View key={scenarioId} style={styles.card}>
            <Text style={type.heading} accessibilityRole="header">
              {getScenario(scenarioId)?.title ?? 'Deleted scenario'}
            </Text>
            {outcomes[scenarioId] ? (
              <Text style={styles.outcome}>The real one: {outcomeLabel(outcomes[scenarioId]!.outcome)}</Text>
            ) : null}
            {list.length > 1 ? (
              <View style={styles.progress}>
                <Text style={styles.fromTo}>
                  {first} → {latest}
                </Text>
                <Text style={type.caption}>
                  out of {MAX_TOTAL}, over {list.length} attempts
                </Text>
              </View>
            ) : (
              <Text style={type.caption}>
                {latest}/{MAX_TOTAL} · 1 attempt. Retry it to see your progress here.
              </Text>
            )}
            {list.length > 1
              ? scoredDimensions(latestGrade).map(([dimension, result]) => {
                  const before = firstGrade.dimensions[dimension]?.score;
                  return (
                    <View
                      key={dimension}
                      style={styles.skill}
                      accessible
                      accessibilityLabel={`${rubrics[dimension].name}: first ${before ?? 'not scored'}, latest ${result.score} out of 4`}>
                      <View style={styles.skillHead}>
                        <Text style={styles.skillName}>{rubrics[dimension].name}</Text>
                        <Text style={type.caption}>
                          {before ?? '–'} → {result.score}
                        </Text>
                      </View>
                      <SkillBar score={result.score} previous={before} />
                    </View>
                  );
                })
              : null}
            {list.map((attempt) => (
              <Pressable
                key={attempt.id}
                accessibilityRole="button"
                accessibilityLabel={`Attempt ${attempt.number}, ${attempt.difficulty}, ${total(attempt.grade)} out of ${MAX_TOTAL}. Opens the scorecard.`}
                onPress={() => router.push({ pathname: '/scorecard/[attemptId]', params: { attemptId: attempt.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View>
                  <Text style={type.body}>
                    Attempt {attempt.number} · {attempt.difficulty}
                  </Text>
                  <Text style={type.caption}>{new Date(attempt.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.score}>
                  {total(attempt.grade)}/{MAX_TOTAL} ›
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  row: {
    minHeight: MIN_TARGET,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  score: { fontSize: 17, fontWeight: '700', color: colors.primary },
  progress: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  pressed: { opacity: 0.6 },
  outcome: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '700', color: colors.success, backgroundColor: '#EAF5EF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  fromTo: { fontSize: 24, fontWeight: '800', color: colors.text },
  skill: { gap: 4 },
  skillHead: { flexDirection: 'row', justifyContent: 'space-between' },
  skillName: { fontSize: 15, fontWeight: '600', color: colors.text },
});
