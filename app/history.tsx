import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAttempts } from '@/attempts/store';
import { MAX_TOTAL, totalScore as total } from '@/grading/rubric.schema';
import { usePro } from '@/purchases';
import { getScenario } from '@/scenarios';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

/** Progress history (Pro): every graded attempt, grouped by conversation, oldest first. */
export default function History() {
  const pro = usePro();
  const attempts = useAttempts();
  if (!pro) return <Redirect href="/" />;

  const byScenario = [...new Set(attempts.map((attempt) => attempt.scenarioId))];

  return (
    <Screen>
      {byScenario.length === 0 ? <Text style={type.body}>No graded conversations yet.</Text> : null}
      {byScenario.map((scenarioId) => {
        const list = attempts.filter((attempt) => attempt.scenarioId === scenarioId);
        const first = total(list[0]!.grade);
        const latest = total(list.at(-1)!.grade);
        return (
          <View key={scenarioId} style={styles.card}>
            <Text style={type.heading} accessibilityRole="header">
              {getScenario(scenarioId)?.title ?? 'Deleted scenario'}
            </Text>
            <Text style={type.caption}>
              {list.length} {list.length === 1 ? 'attempt' : 'attempts'} · first {first}/{MAX_TOTAL} · latest {latest}/{MAX_TOTAL}
            </Text>
            {list.map((attempt) => (
              <Pressable
                key={attempt.id}
                accessibilityRole="button"
                accessibilityLabel={`Attempt ${attempt.number}, ${attempt.difficulty}, ${total(attempt.grade)} out of ${MAX_TOTAL}. Opens the scorecard.`}
                onPress={() => router.push({ pathname: '/scorecard/[attemptId]', params: { attemptId: attempt.id } })}
                style={styles.row}>
                <Text style={type.body}>
                  Attempt {attempt.number} · {attempt.difficulty}
                </Text>
                <Text style={styles.score}>
                  {total(attempt.grade)}/{MAX_TOTAL}
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
});
