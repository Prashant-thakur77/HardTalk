import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePreferences } from '@/a11y/preferences';
import { findAttempt, findPreviousAttempt, getGradedSessionsUsed, useAttempts } from '@/attempts/store';
import { usePro } from '@/purchases';
import { FREE_GRADED_SESSIONS } from '@/purchases/gates';
import { biggestJump, type Jump } from '@/grading/compare';
import { MAX_TOTAL, totalScore, type Dimension, type DimensionGrade, type Grade } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { getScenario } from '@/scenarios';
import { peopleIn } from '@/scenarios/people';
import { difficultySchema, type Difficulty } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { getTrack } from '@/tracks';
import type { Track } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { Celebration } from '@/ui/Celebration';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { RoomVerdicts } from '@/ui/RoomVerdicts';
import { ScoreRing } from '@/ui/ScoreRing';
import { Screen } from '@/ui/Screen';
import { SkillBar } from '@/ui/SkillBar';
import { skillKey } from '@/ui/skillSteps';
import { colors, MIN_TARGET, scoreColors, shadow, space, type } from '@/ui/theme';

/**
 * A plain-words read of the total, calibrated to the rubric (most first tries land near 8), and
 * honest about a retry that went down.
 */
function verdict(score: number, previousScore: number | undefined): string {
  if (previousScore !== undefined && score < previousScore) return 'Lower than last time. See what changed below.';
  if (score >= 14) return 'Strong. This would land.';
  if (score >= 11) return 'Solid. One or two things to sharpen.';
  if (score >= 8) return 'Getting there.';
  return previousScore === undefined ? 'A typical first try.' : 'Still early. Start with the open skill.';
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
  const pro = usePro();
  const { width } = useWindowDimensions();
  const [showTranscript, setShowTranscript] = useState(false);
  const attempt = findAttempt(attempts, attemptId);
  const scenario = attempt && getScenario(attempt.scenarioId);

  if (!attempt || !scenario) return <Text style={type.body}>Scorecard not found.</Text>;

  const previous = findPreviousAttempt(attempts, attempt);
  const { grade } = attempt;
  const score = totalScore(grade);
  const previousScore = previous && totalScore(previous.grade);
  const track = getTrack(scenario.track);

  const retry = () => void startSession(scenario.id, attempt.difficulty, attempt.mode, 'replace');
  // After a strong try the next step is more pushback, so that becomes the main button.
  const up = score >= 12 ? nextLevel(attempt.difficulty) : null;
  // The weakest skill is where the next try should go.
  const weakest = [...track.rubrics].sort(
    (a, b) => (grade.dimensions[a]?.score ?? 0) - (grade.dimensions[b]?.score ?? 0),
  )[0];

  const outOfFree = !pro && getGradedSessionsUsed() >= FREE_GRADED_SESSIONS;
  const lastFree = outOfFree && attempt.id === attempts.at(-1)?.id && attempts.length === FREE_GRADED_SESSIONS;

  return (
    <Screen
      footer={
        up ? (
          <>
            <Button
              label={`Try ${up} · ${scenario.difficulty_levels[up].name}`}
              onPress={() => void startSession(scenario.id, up, attempt.mode, 'replace')}
              hint="Same conversation, more pushback"
            />
            <View style={styles.footerRow}>
              <Link label="Retry this conversation" text="Retry" onPress={retry} />
              <Link label="Pick another conversation" text="Pick another" onPress={() => router.dismissTo('/')} />
            </View>
          </>
        ) : (
          <>
            <Button label="Retry this conversation" onPress={retry} hint="Runs the same scenario again" />
            <Link label="Pick another conversation" onPress={() => router.dismissTo('/')} />
          </>
        )
      }>
      <Stack.Screen options={{ title: `Attempt ${attempt.number} · ${attempt.difficulty}` }} />
      <PurchaseNotice />
      <View style={styles.summary} accessible accessibilityLabel={summaryLabel(score, previousScore)}>
        {previousScore !== undefined && score > previousScore ? <Celebration reduceMotion={reduceMotion} /> : null}
        <View style={[styles.totalRow, width < 360 && styles.stacked]}>
          <ScoreRing score={score} max={MAX_TOTAL} previous={previousScore} reduceMotion={reduceMotion} />
          <View style={styles.totalText}>
            <Text style={type.caption}>{scenario.title}</Text>
            <Text style={styles.verdict}>{verdict(score, previousScore)}</Text>
            {previousScore !== undefined ? (
              <View style={styles.deltaRow}>
                <Text style={styles.fromTo}>
                  {previousScore} → {score}
                </Text>
                <Delta before={previousScore} after={score} />
              </View>
            ) : null}
          </View>
        </View>
        <Text style={type.body}>{keyLine(grade, track)}</Text>
      </View>


      <RoomVerdicts
        people={peopleIn(scenario, attempt.difficulty)}
        grade={grade}
        previous={previous?.grade}
        trackRubrics={track.rubrics}
        reduceMotion={reduceMotion}
      />

      {previous ? <WhatChanged jump={biggestJump(previous.grade, grade)} /> : null}

      <NextStep
        score={score}
        level={attempt.difficulty}
        personaName={scenario.persona.name}
        levelName={(level) => scenario.difficulty_levels[level].name}
        levelSummary={(level) => scenario.difficulty_levels[level].summary}
        weakest={weakest && grade.dimensions[weakest] ? { dimension: weakest, grade: grade.dimensions[weakest]! } : null}
      />
      {outOfFree ? (
        <Text style={type.caption}>
          {lastFree
            ? 'That was your last free graded session. The next one opens Pro.'
            : 'Your free graded sessions are used, so the next one opens Pro.'}
        </Text>
      ) : null}

      <Text style={type.heading} accessibilityRole="header">
        Your four skills
      </Text>
      {previous ? <Text style={type.caption}>{skillKey('last time')}</Text> : null}
      {track.rubrics.map((dimension) => {
        const result = grade.dimensions[dimension];
        return result ? (
          <DimensionCard
            key={dimension}
            dimension={dimension}
            result={result}
            previousScore={previous?.grade.dimensions[dimension]?.score}
            weakest={dimension === weakest}
            // After a weaker try its better line is already in "Next time, try" above.
            startOpen={dimension === weakest && Boolean(up)}
          />
        ) : null;
      })}
      <MockBanner
        compact
        message={
          attempt.mode === 'text'
            ? 'Mock mode: this is the recorded grade for the recorded lines you sent, checked against them. Live mode grades what you type.'
            : 'Mock mode: this is the recorded example grade for this replay, checked against the transcript below. Live mode grades what you actually say.'
        }
      />

      <Link
        label={showTranscript ? 'Hide the full transcript' : 'Show the full transcript'}
        onPress={() => setShowTranscript((open) => !open)}
      />
      {showTranscript ? (
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
      ) : null}
    </Screen>
  );
}

/**
 * The one line that matters most in this track (your ask, your close, your claim), or the
 * nearest thing to it. With no quote it says only what is known; a missing quote can mean there
 * was none, or one the evidence check threw out.
 */
function keyLine(grade: Grade, track: Track): string {
  const source = grade.dimensions[track.key_line.from];
  // A weak key line is labelled as the closest you came, so a low score never reads as praise.
  const strong = (source?.score ?? 0) >= 3;
  if (grade.key_line) return `${strong ? track.key_line.label : track.key_line.closest}: “${grade.key_line}”`;
  const closest = source?.evidence_quotes[0];
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
  level,
  personaName,
  levelName,
  levelSummary,
  weakest,
}: {
  score: number;
  level: Difficulty;
  personaName: string;
  levelName: (level: Difficulty) => string;
  levelSummary: (level: Difficulty) => string;
  weakest: { dimension: Dimension; grade: DimensionGrade } | null;
}) {
  const up = nextLevel(level);
  if (score >= 12 && up) {
    return (
      <View style={[styles.card, styles.next]}>
        <Text style={styles.nextLabel}>What next</Text>
        <Text style={type.body}>
          Ready for more pushback? At {up} · {levelName(up)}, {personaName} gets tougher. {levelSummary(up)}
        </Text>
      </View>
    );
  }
  // After a weaker try, the weakest skill's better line, so the retry has one thing to change.
  if (!weakest) return null;
  return (
    <View style={[styles.card, styles.next]}>
      <Text style={styles.nextLabel}>Next time, try</Text>
      <Text style={styles.quoteText}>“{weakest.grade.better_line}”</Text>
      <Text style={type.caption}>Your weakest skill this time: {rubrics[weakest.dimension].name}.</Text>
    </View>
  );
}

/** A text button. `text` is a shorter visible form of the label, and always part of it (WCAG 2.5.3). */
function Link({ label, text = label, onPress }: { label: string; text?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{text}</Text>
    </Pressable>
  );
}

/** The retry's proof: the skill that moved most, and what you said differently to move it. */
function WhatChanged({ jump }: { jump: Jump | null }) {
  if (!jump) return null;
  const name = rubrics[jump.dimension].name;
  const lastTime = jump.beforeQuote ? `“${jump.beforeQuote}”` : 'Nothing the grader could quote.';
  const thisTime = jump.afterQuote ? `“${jump.afterQuote}”` : 'Nothing the grader could quote.';
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Biggest jump: ${name}, ${jump.before} to ${jump.after}. Last time you said: ${lastTime} This time you said: ${thisTime}`}>
      <Text style={styles.nextLabel}>What changed</Text>
      <Text style={type.heading}>
        {name}: {jump.before} → {jump.after}
      </Text>
      <View style={styles.compare}>
        <Text style={styles.compareLabel}>Last time</Text>
        <Text style={[type.body, styles.muted]}>{lastTime}</Text>
      </View>
      <View style={[styles.compare, styles.compareNow]}>
        <Text style={[styles.compareLabel, styles.nowLabel]}>This time</Text>
        <Text style={styles.nowText}>{thisTime}</Text>
      </View>
    </View>
  );
}

/** One skill: score and bar always shown; the quote, the why and a better line on a tap. The
 * weakest one says so, and starts open unless "Next time, try" already shows its better line. */
function DimensionCard({
  dimension,
  result,
  previousScore,
  startOpen,
  weakest,
}: {
  dimension: Dimension;
  result: DimensionGrade;
  previousScore: number | undefined;
  startOpen: boolean;
  weakest: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const rubric = rubrics[dimension];
  const label = rubric.name;
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={styles.cardHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityHint={open ? 'Hides the evidence' : 'Shows what you said, why, and a better line'}
        accessibilityLabel={
          previousScore === undefined
            ? `${label}: ${result.score} out of 4`
            : `${label}: ${result.score} out of 4, was ${previousScore}`
        }>
        {weakest ? <Text style={styles.startHere}>Start here</Text> : null}
        <View style={styles.cardHeader}>
          <Text style={[type.heading, styles.cardTitle]}>{label}</Text>
          <View style={styles.scoreRow}>
            {previousScore !== undefined ? (
              <>
                <Text style={[styles.score, { color: scoreColors[previousScore] }]}>{previousScore}</Text>
                <Text style={styles.arrow}>→</Text>
              </>
            ) : null}
            <Text style={[styles.score, { color: scoreColors[result.score] }]}>{result.score}</Text>
            {previousScore === undefined ? <Text style={styles.scoreMax}>/4</Text> : null}
            <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
          </View>
        </View>
        <Text style={styles.framework}>{rubric.framework.name}</Text>
      </Pressable>
      <SkillBar score={result.score} previous={previousScore} />

      {open ? (
        <>
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
        </>
      ) : null}
    </View>
  );
}

function Delta({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  if (delta === 0) return null;
  const color = delta > 0 ? colors.success : delta < 0 ? colors.danger : colors.textMuted;
  return (
    <View style={[styles.delta, { borderColor: color }]}>
      <Text style={[styles.deltaText, { color }]}>{signed(delta)}</Text>
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
  fromTo: { fontSize: 26, fontWeight: '800', color: colors.text },
  stacked: { flexDirection: 'column', alignItems: 'flex-start' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-around' },
  link: { minHeight: MIN_TARGET, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space.sm },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
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
  compare: { gap: 2, borderRadius: 10, padding: space.sm + 2, backgroundColor: colors.background },
  compareNow: { backgroundColor: '#EAF5EF' },
  compareLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  nowLabel: { color: colors.success },
  muted: { color: colors.textMuted },
  nowText: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  nextLabel: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardHead: { gap: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  cardTitle: { flexShrink: 1 },
  framework: { fontSize: 13, color: colors.textMuted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  score: { fontSize: 26, fontWeight: '700' },
  scoreMax: { fontSize: 16, color: colors.textMuted },
  startHere: { fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  chevron: { fontSize: 20, fontWeight: '700', color: colors.textMuted, marginLeft: space.xs },
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
  deltaText: { fontSize: 22, fontWeight: '700' },
  transcript: { gap: space.sm },
  speaker: { fontWeight: '700' },
});
