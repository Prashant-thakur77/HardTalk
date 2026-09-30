import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { clearOutcome, deleteAllOutcomes, OUTCOMES, outcomeLabel, recordOutcome, useOutcomes } from '@/attempts/outcomes';
import { deleteAllAttempts, getGradedSessionsUsed, useAttempts } from '@/attempts/store';
import { MAX_TOTAL, totalScore } from '@/grading/rubric.schema';
import { restorePurchases, usePro } from '@/purchases';
import { FREE_GRADED_SESSIONS } from '@/purchases/gates';
import { safety } from '@/safety';
import { getScenario, scenarios, useCustomScenarios } from '@/scenarios';
import { isCustomScenario } from '@/scenarios/custom';
import { peopleIn } from '@/scenarios/people';
import type { Scenario } from '@/scenarios/schema';
import { openCustomScenario, startSession } from '@/session/start';
import { getTrack, tracks } from '@/tracks';
import type { TrackId } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { Face } from '@/ui/Face';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, scoreColors, shadow, space, type } from '@/ui/theme';
import { TrackTabs } from '@/ui/TrackTabs';

export default function ScenarioList() {
  const attempts = useAttempts();
  const outcomes = useOutcomes();
  const custom = useCustomScenarios();
  const pro = usePro();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Returning users land on the track they last practised.
  const [trackId, setTrackId] = useState<TrackId>(
    () => getScenario(attempts.at(-1)?.scenarioId ?? '')?.track ?? 'workplace',
  );
  const track = getTrack(trackId);

  const deleteHistory = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await Promise.all([deleteAllAttempts(), deleteAllOutcomes()]);
    setConfirmDelete(false);
  };

  const restore = async () => {
    setRestoreMessage('Restoring…');
    setRestoreMessage(await restorePurchases());
  };

  const freeLeft = Math.max(0, FREE_GRADED_SESSIONS - getGradedSessionsUsed());
  const last = attempts.at(-1);
  const lastScenario = last && getScenario(last.scenarioId);
  // The "real one" is always one of your own scenarios: the latest one you practised.
  const lastOwnId = attempts.findLast((attempt) => isCustomScenario(attempt.scenarioId))?.scenarioId;
  const lastOwn = lastOwnId ? getScenario(lastOwnId) : undefined;

  const card = (scenario: Scenario) => {
    const mine = attempts.filter((attempt) => attempt.scenarioId === scenario.id);
    const tries = mine.length;
    const best = Math.max(0, ...mine.map((attempt) => totalScore(attempt.grade)));
    const people = peopleIn(scenario, 'L1');
    const names = people.map((person) => person.name);
    const personaLine =
      names.length === 1
        ? `With ${scenario.persona.name}, ${scenario.persona.role.toLowerCase()}`
        : `With ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
    return (
      <Pressable
        key={scenario.id}
        accessibilityRole="button"
        accessibilityLabel={`${scenario.title}. ${personaLine}.${tries ? ` ${tries} ${tries === 1 ? 'attempt' : 'attempts'}.` : ''}`}
        accessibilityHint="Opens the brief and difficulty choice"
        onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.faces}>
          {people.map((person, index) => (
            <View key={person.name} style={index > 0 && styles.panelFace}>
              <Face face={person.face} mood={person.mood} size={44} />
            </View>
          ))}
          <Text style={[type.caption, styles.personaLine]} numberOfLines={2}>
            {personaLine}
          </Text>
        </View>
        <Text style={type.heading}>{scenario.title}</Text>
        <Text style={[type.body, styles.summary]} numberOfLines={2}>
          {scenario.summary}
        </Text>
        <View style={styles.chips}>
          {tries > 0 ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {tries} {tries === 1 ? 'attempt' : 'attempts'}
              </Text>
            </View>
          ) : null}
          {tries > 0 ? (
            <View style={styles.chip}>
              <Text style={[styles.chipText, { color: scoreColors[Math.max(1, Math.round((best / MAX_TOTAL) * 4))] }]}>
                Best {best}/{MAX_TOTAL}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const checkin = lastOwn ? (
    <>
      {outcomes[lastOwn.id] ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`How it went: ${outcomeLabel(outcomes[lastOwn.id]!.outcome)}. Change`}
          onPress={() => void clearOutcome(lastOwn.id)}
          style={styles.progressLink}>
          <Text style={type.caption}>
            How it went: {outcomeLabel(outcomes[lastOwn.id]!.outcome)} · <Text style={styles.headLink}>Change</Text>
          </Text>
        </Pressable>
      ) : (
        <>
          <Text style={type.caption}>When you’ve had it, how did it go?</Text>
          <View style={styles.checkinRow}>
            {OUTCOMES.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`The real one: ${option.label}`}
                onPress={() => void recordOutcome(lastOwn.id, option.value)}
                style={({ pressed }) => [styles.checkinChip, pressed && styles.pressed]}>
                <Text style={styles.checkinText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </>
  ) : null;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.tagline} accessibilityRole="header">
          Practise the conversation before you have it.
        </Text>
        {last ? null : (
          <Text style={styles.heroBody}>Say it out loud. Get a scorecard that quotes you. Try again.</Text>
        )}
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>
            {pro ? 'Pro · unlimited practice' : `${freeLeft} of ${FREE_GRADED_SESSIONS} free graded sessions left`}
          </Text>
        </View>
      </View>
      <PurchaseNotice />
      <MockBanner compact />
      {last && lastScenario ? (
        <View style={styles.continue}>
          <Text style={styles.continueLabel}>Pick up where you left off</Text>
          <Text style={styles.continueTitle}>{lastScenario.title}</Text>
          <View style={styles.faces}>
            {peopleIn(lastScenario, last.difficulty).map((person, index) => (
              <View key={person.name} style={index > 0 && styles.panelFace}>
                <Face face={person.face} mood={person.mood} size={32} />
              </View>
            ))}
            <Text style={[type.caption, styles.personaLine]}>
              Last try {totalScore(last.grade)}/{MAX_TOTAL} at {last.difficulty}
            </Text>
          </View>
          {!pro && freeLeft === 0 ? <Text style={type.caption}>Your free graded sessions are used, so this opens Pro.</Text> : null}
          <Button
            label="Practise it again"
            hint={lastScenario.title}
            onPress={() => void startSession(lastScenario.id, last.difficulty, last.mode, 'push')}
          />
          {pro ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Your progress"
              onPress={() => router.push('/history')}
              style={styles.progressLink}>
              <Text style={styles.headLink}>Your progress ›</Text>
            </Pressable>
          ) : null}
          {lastOwn?.id === lastScenario.id ? checkin : null}
        </View>
      ) : null}
      {lastOwn && lastOwn.id !== lastScenario?.id ? (
        <View style={styles.realOne}>
          <Text style={styles.continueLabel}>The real one</Text>
          <Text style={type.body} numberOfLines={2}>
            {lastOwn.title}
          </Text>
          {checkin}
        </View>
      ) : null}
      <Text style={styles.section} accessibilityRole="header">
        What do you want to practise?
      </Text>
      <TrackTabs tracks={tracks} selected={trackId} onSelect={setTrackId} />
      <Text style={type.caption}>{track.tagline}</Text>
      {scenarios.filter((scenario) => scenario.track === trackId).map(card)}

      {custom.some((scenario) => scenario.track === trackId) ? (
        <Text style={type.heading} accessibilityRole="header">
          Your scenarios
        </Text>
      ) : null}
      {custom.filter((scenario) => scenario.track === trackId).map(card)}

      <View style={styles.bring}>
        <Text style={styles.continueLabel}>Bring the real one</Text>
        <Text style={type.body}>{track.paste_label} HardTalk builds the panel for it.</Text>
        <Button
          label={pro ? 'Create your own scenario' : 'Create your own scenario (Pro)'}
          onPress={() => void openCustomScenario(trackId)}
          hint="Drafts a panel from a job posting, pitch or motion you paste"
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
          onPress={() => void restore()}
          style={styles.link}>
          <Text style={styles.linkText}>Restore purchases</Text>
        </Pressable>
        {restoreMessage ? (
          <Text style={type.caption} accessibilityLiveRegion="polite">
            {restoreMessage}
          </Text>
        ) : null}
        {attempts.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              confirmDelete ? 'Confirm: delete all saved transcripts and scores' : 'Delete my practice history'
            }
            onPress={() => void deleteHistory()}
            style={styles.link}>
            <Text style={[styles.linkText, styles.muted, confirmDelete && styles.danger]}>
              {confirmDelete ? 'Tap again to delete all transcripts and scores' : 'Delete my practice history'}
            </Text>
          </Pressable>
        ) : null}
        <Text style={[type.caption, styles.disclaimer]}>{safety.disclaimer}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: space.md + 4, gap: space.sm, ...shadow },
  tagline: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.onHero },
  heroBody: { fontSize: 16, lineHeight: 23, color: colors.onHeroMuted },
  heroPill: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: { color: colors.onHero, fontSize: 14, fontWeight: '700' },
  section: { ...type.heading, marginTop: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm + 2,
    ...shadow,
  },
  faces: { flexDirection: 'row', alignItems: 'center' },
  panelFace: { marginLeft: -14 },
  personaLine: { flex: 1, marginLeft: space.sm, gap: 2 },
  continue: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: space.md,
    gap: space.sm,
    ...shadow,
  },
  progressLink: { minHeight: MIN_TARGET, justifyContent: 'center', alignItems: 'center' },
  checkinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  checkinChip: {
    minHeight: MIN_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space.sm + 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  checkinText: { fontSize: 14, fontWeight: '700', color: colors.text },
  bring: { backgroundColor: colors.quote, borderRadius: 16, padding: space.md, gap: space.sm },
  continueLabel: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  continueTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.text },
  headLink: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  realOne: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  summary: { color: colors.textMuted },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  chip: { backgroundColor: colors.quote, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  actions: { gap: space.sm, marginTop: space.sm },
  link: { minHeight: MIN_TARGET, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  muted: { color: colors.textMuted },
  danger: { color: colors.danger },
  disclaimer: { textAlign: 'center' },
});
