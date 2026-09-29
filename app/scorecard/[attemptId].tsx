import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/a11y/preferences';
import { findAttempt, findPreviousAttempt, useAttempts } from '@/attempts/store';
import { MAX_TOTAL, totalScore, type Dimension, type DimensionGrade, type Grade } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { getScenario } from '@/scenarios';
import { peopleIn, reactionMood } from '@/scenarios/people';
import { difficultySchema, type Difficulty } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { getTrack } from '@/tracks';
import type { Track } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { Celebration } from '@/ui/Celebration';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Room } from '@/ui/Room';
import { ScoreRing } from '@/ui/ScoreRing';
import { Screen } from '@/ui/Screen';
import { SkillBar } from '@/ui/SkillBar';
import { colors, scoreColors, shadow, space, type } from '@/ui/theme';

/** A plain-words read of the total, calibrated to the rubric: most first tries land near 8. */
function verdict(score: number): string {
  if (score >= 14) return 'Strong. This would land.';
  if (score >= 11) return 'Solid. One or two things to sharpen.';
  if (score >= 8) return 'Getting there.';
  return 'A typical first try.';
}

function nextLevel(level: Difficulty): Difficulty | null {
  const levels = difficultySchema.options;
  return levels[levels.indexOf(level) + 1] ?? null;
}

function signed(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

export default function Scorecard() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const attempts = useAttempts();
  const { reduceMotion } = usePreferences();
  const attempt = findAttempt(attempts, attemptId);
  const scenario = attempt && getScenario(attempt.scenarioId);

  if (!attempt || !scenario) return <Text style={type.body}>Scorecard not found.</Text>;

  const previous = findPreviousAttempt(attempts, attempt);
  const { grade } = attempt;
  const score = totalScore(grade);
  const previousScore = previous && totalScore(previous.grade);
  const track = getTrack(scenario.track);

  const retry = () => void startSession(scenario.id, attempt.difficulty, attempt.mode, 'replace');

  return (
    <Screen
      footer={
        <>
          <Button label="Retry this conversation" onPress={retry} hint="Runs the same scenario again" />
          <Button label="Pick another conversation" variant="secondary" onPress={() => router.dismissTo('/')} />
        </>
      }>
      <MockBanner
        message={
          attempt.mode === 'text'
            ? 'Mock mode: this is the recorded grade, checked against what you typed. It cannot grade new words, so any line you changed scores lower here. Live mode grades what you type.'
            : 'Mock mode: this is the recorded example grade for this replay, checked against the transcript below. Live mode grades what you actually say.'
        }
      />
      <PurchaseNotice />
      <View style={styles.summary} accessible accessibilityLabel={summaryLabel(score, previousScore)}>
        {previousScore !== undefined && score > previousScore ? <Celebration reduceMotion={reduceMotion} /> : null}
        <View style={styles.totalRow}>
          <ScoreRing score={score} max={MAX_TOTAL} />
          <View style={styles.totalText}>
            <Text style={type.caption}>
              {scenario.title} · attempt {attempt.number} · {attempt.difficulty}
            </Text>
            <Text style={styles.verdict}>{verdict(score)}</Text>
            {previousScore !== undefined ? (
              <View style={styles.deltaRow}>
                <Delta before={previousScore} after={score} large />
                <Text style={type.caption}>vs your last try at {attempt.difficulty}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.reaction}>
          <Room
            people={peopleIn(scenario, attempt.difficulty)}
            mood={reactionMood(score)}
            size={40}
            reduceMotion={reduceMotion}
          />
          <Text style={[type.body, styles.keyLine]}>{keyLine(grade, track)}</Text>
        </View>
      </View>

      <NextStep
        score={score}
        grade={grade}
        dimensions={track.rubrics}
        level={attempt.difficulty}
        personaName={scenario.persona.name}
        levelName={(level) => scenario.difficulty_levels[level].name}
        levelSummary={(level) => scenario.difficulty_levels[level].summary}
        onLevelUp={(level) => void startSession(scenario.id, level, attempt.mode, 'replace')}
      />

      {track.rubrics.map((dimension) => {
        const result = grade.dimensions[dimension];
        return result ? (
          <DimensionCard
            key={dimension}
            dimension={dimension}
            result={result}
            previousScore={previous?.grade.dimensions[dimension]?.score}
          />
        ) : null;
      })}

      <Text style={type.heading} accessibilityRole="header">
        Full transcript
      </Text>
      <View style={styles.transcript}>
        {attempt.turns.map((turn, index) => (
          <Text key={index} style={type.body}>
            <Text style={styles.speaker}>
              {turn.speaker === 'persona' ? (turn.name ?? scenario.persona.name) : 'You'}:{' '}
            </Text>
            {turn.text}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

/**
 * The one line that matters most in this track (your ask, your close, your claim), or the
 * nearest thing to it. With no quote it says only what is known; a missing quote can mean there
 * was none, or one the evidence check threw out.
 */
function keyLine(grade: Grade, track: Track): string {
  if (grade.key_line) return `${track.key_line.label}: “${grade.key_line}”`;
  const closest = grade.dimensions[track.key_line.from]?.evidence_quotes[0];
  if (closest) return `${track.key_line.closest}: “${closest}”`;
  return track.key_line.none;
}

function summaryLabel(score: number, previousScore: number | undefined): string {
  const base = `Total score ${score} out of ${MAX_TOTAL}.`;
  if (previousScore === undefined) return base;
  return `${base} Previous attempt ${previousScore}. Change ${signed(score - previousScore)}.`;
}

/** One concrete next step: level up after a strong try, otherwise the weakest skill's line. */
function NextStep({
  score,
  grade,
  dimensions,
  level,
  personaName,
  levelName,
  levelSummary,
  onLevelUp,
}: {
  score: number;
  grade: Grade;
  dimensions: Dimension[];
  level: Difficulty;
  personaName: string;
  levelName: (level: Difficulty) => string;
  levelSummary: (level: Difficulty) => string;
  onLevelUp: (level: Difficulty) => void;
}) {
  const up = nextLevel(level);
  if (score >= 12 && up) {
    return (
      <View style={[styles.card, styles.next]}>
        <Text style={styles.nextLabel}>What next</Text>
        <Text style={type.body}>
          Ready for more pushback? At {up}, {personaName}: {levelSummary(up).charAt(0).toLowerCase()}
          {levelSummary(up).slice(1)}
        </Text>
        <Button label={`Try ${up} · ${levelName(up)}`} variant="secondary" onPress={() => onLevelUp(up)} />
      </View>
    );
  }
  const scoreOf = (dimension: Dimension) => grade.dimensions[dimension]?.score ?? 0;
  const weakest = [...dimensions].sort((a, b) => scoreOf(a) - scoreOf(b))[0];
  const betterLine = weakest && grade.dimensions[weakest]?.better_line;
  if (!weakest || !betterLine) return null;
  return (
    <View style={[styles.card, styles.next]}>
      <Text style={styles.nextLabel}>What next</Text>
      <Text style={type.body}>
        Your weakest area was {rubrics[weakest].name}. Next time, try:
      </Text>
      <Text style={styles.nextLine}>“{betterLine}”</Text>
    </View>
  );
}

function DimensionCard({
  dimension,
  result,
  previousScore,
}: {
  dimension: Dimension;
  result: DimensionGrade;
  previousScore: number | undefined;
}) {
  const rubric = rubrics[dimension];
  const label = rubric.name;
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
        <View style={styles.cardTitle}>
          <Text style={type.heading}>{label}</Text>
          <Text style={styles.framework}>{rubric.framework.name}</Text>
        </View>
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
      <SkillBar score={result.score} previous={previousScore} />

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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
    ...shadow,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  totalText: { flex: 1, gap: space.xs },
  verdict: { fontSize: 20, fontWeight: '700', color: colors.text },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  keyLine: { flex: 1, minWidth: 180 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    ...shadow,
  },
  next: { backgroundColor: colors.quote, borderColor: colors.quote },
  nextLabel: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  nextLine: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flexShrink: 1, gap: 2 },
  framework: { fontSize: 13, color: colors.textMuted },
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
  better: { gap: 4, backgroundColor: '#EAF5EF', borderRadius: 10, padding: space.sm + 4 },
  betterLabel: { fontSize: 13, fontWeight: '700', color: colors.success, textTransform: 'uppercase' },
  delta: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginLeft: space.xs },
  deltaText: { fontSize: 15, fontWeight: '700' },
  deltaLarge: { fontSize: 22 },
  transcript: { gap: space.sm },
  speaker: { fontWeight: '700' },
});
