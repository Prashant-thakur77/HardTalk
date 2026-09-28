import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { findAttempt, findPreviousAttempt, useAttempts } from '@/attempts/store';
import { DIMENSION_LABELS, DIMENSIONS, type Dimension, type Grade } from '@/grading/rubric.schema';
import { getScenario } from '@/scenarios';
import { Button } from '@/ui/Button';
import { MockBanner } from '@/ui/MockBanner';
import { Screen } from '@/ui/Screen';
import { colors, radius, scoreColors, space, type } from '@/ui/theme';

const MAX_TOTAL = DIMENSIONS.length * 4;

function total(grade: Grade): number {
  return DIMENSIONS.reduce((sum, dimension) => sum + grade.dimensions[dimension].score, 0);
}

function signed(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

export default function Scorecard() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const attempts = useAttempts();
  const attempt = findAttempt(attempts, attemptId);
  const scenario = attempt && getScenario(attempt.scenarioId);

  if (!attempt || !scenario) return <Text style={type.body}>Scorecard not found.</Text>;

  const previous = findPreviousAttempt(attempts, attempt);
  const { grade } = attempt;
  const score = total(grade);

  const retry = () =>
    router.replace({
      pathname: '/session/[id]',
      params: { id: scenario.id, difficulty: attempt.difficulty },
    });

  return (
    <Screen
      footer={
        <>
          <Button label="Retry this conversation" onPress={retry} hint="Runs the same scenario again" />
          <Button label="Pick another conversation" variant="secondary" onPress={() => router.dismissTo('/')} />
        </>
      }>
      <MockBanner />
      <View style={styles.summary} accessible accessibilityLabel={summaryLabel(score, previous && total(previous.grade))}>
        <Text style={type.caption}>
          {scenario.title} · attempt {attempt.number} · {attempt.difficulty}
        </Text>
        <View style={styles.totalRow}>
          <Text style={styles.total}>
            {score}
            <Text style={styles.totalMax}>/{MAX_TOTAL}</Text>
          </Text>
          {previous ? <Delta before={total(previous.grade)} after={score} large /> : null}
        </View>
        <Text style={type.body}>
          {grade.ask_made && grade.ask_text
            ? `Your ask: “${grade.ask_text}”`
            : 'No clear ask was made in this conversation.'}
        </Text>
      </View>

      {DIMENSIONS.map((dimension) => (
        <DimensionCard
          key={dimension}
          dimension={dimension}
          grade={grade}
          previousScore={previous?.grade.dimensions[dimension].score}
        />
      ))}

      <Text style={type.heading} accessibilityRole="header">
        Full transcript
      </Text>
      <View style={styles.transcript}>
        {attempt.turns.map((turn, index) => (
          <Text key={index} style={type.body}>
            <Text style={styles.speaker}>{turn.speaker === 'persona' ? scenario.persona.name : 'You'}: </Text>
            {turn.text}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

function summaryLabel(score: number, previousScore: number | undefined): string {
  const base = `Total score ${score} out of ${MAX_TOTAL}.`;
  if (previousScore === undefined) return base;
  return `${base} Previous attempt ${previousScore}. Change ${signed(score - previousScore)}.`;
}

function DimensionCard({
  dimension,
  grade,
  previousScore,
}: {
  dimension: Dimension;
  grade: Grade;
  previousScore: number | undefined;
}) {
  const result = grade.dimensions[dimension];
  const label = DIMENSION_LABELS[dimension];
  return (
    <View style={styles.card}>
      <View
        style={styles.cardHeader}
        accessible
        accessibilityRole="header"
        accessibilityLabel={
          previousScore === undefined
            ? `${label}: ${result.score} out of 4`
            : `${label}: ${result.score} out of 4, was ${previousScore}`
        }>
        <Text style={type.heading}>{label}</Text>
        <View style={styles.scoreRow}>
          {previousScore !== undefined ? (
            <>
              <Text style={[styles.score, { color: scoreColors[previousScore] }]}>{previousScore}</Text>
              <Text style={styles.arrow}>→</Text>
            </>
          ) : null}
          <Text style={[styles.score, { color: scoreColors[result.score] }]}>{result.score}</Text>
          <Text style={styles.scoreMax}>/4</Text>
          {previousScore !== undefined ? <Delta before={previousScore} after={result.score} /> : null}
        </View>
      </View>

      {result.evidence_quotes.map((quote) => (
        <View key={quote} style={styles.quote} accessible accessibilityLabel={`You said: ${quote}`}>
          <Text style={styles.quoteText}>“{quote}”</Text>
        </View>
      ))}
      <Text style={type.body}>{result.rationale}</Text>
      <View style={styles.better}>
        <Text style={styles.betterLabel}>Try saying</Text>
        <Text style={type.body}>{result.better_line}</Text>
      </View>
    </View>
  );
}

function Delta({ before, after, large = false }: { before: number; after: number; large?: boolean }) {
  const delta = after - before;
  const color = delta > 0 ? colors.success : delta < 0 ? colors.danger : colors.textMuted;
  return (
    <View style={[styles.delta, { borderColor: color }]}>
      <Text style={[styles.deltaText, large && styles.deltaLarge, { color }]}>{signed(delta)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  total: { fontSize: 48, fontWeight: '700', color: colors.text },
  totalMax: { fontSize: 24, fontWeight: '500', color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  score: { fontSize: 26, fontWeight: '700' },
  scoreMax: { fontSize: 16, color: colors.textMuted },
  arrow: { fontSize: 18, color: colors.textMuted },
  quote: {
    backgroundColor: colors.quote,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 6,
    padding: space.sm + 2,
  },
  quoteText: { fontSize: 16, lineHeight: 23, fontStyle: 'italic', color: colors.text },
  better: { gap: 2 },
  betterLabel: { fontSize: 13, fontWeight: '700', color: colors.success, textTransform: 'uppercase' },
  delta: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginLeft: space.xs },
  deltaText: { fontSize: 15, fontWeight: '700' },
  deltaLarge: { fontSize: 22 },
  transcript: { gap: space.sm },
  speaker: { fontWeight: '700' },
});
