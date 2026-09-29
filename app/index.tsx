import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { deleteAllAttempts, getGradedSessionsUsed, useAttempts } from '@/attempts/store';
import { MAX_TOTAL, totalScore } from '@/grading/rubric.schema';
import { restorePurchases, usePro } from '@/purchases';
import { FREE_GRADED_SESSIONS } from '@/purchases/gates';
import { safety } from '@/safety';
import { scenarios, useCustomScenarios } from '@/scenarios';
import { peopleIn } from '@/scenarios/people';
import type { Scenario } from '@/scenarios/schema';
import { openCustomScenario } from '@/session/start';
import { getTrack, tracks } from '@/tracks';
import type { TrackId } from '@/tracks/schema';
import { Button } from '@/ui/Button';
import { Face } from '@/ui/Face';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, shadow, space, type } from '@/ui/theme';
import { TrackTabs } from '@/ui/TrackTabs';

export default function ScenarioList() {
  const attempts = useAttempts();
  const custom = useCustomScenarios();
  const pro = usePro();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [trackId, setTrackId] = useState<TrackId>('workplace');
  const track = getTrack(trackId);

  const deleteHistory = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteAllAttempts();
    setConfirmDelete(false);
  };

  const restore = async () => {
    setRestoreMessage('Restoring…');
    setRestoreMessage(await restorePurchases());
  };

  const freeLeft = Math.max(0, FREE_GRADED_SESSIONS - getGradedSessionsUsed());

  const card = (scenario: Scenario) => {
    const mine = attempts.filter((attempt) => attempt.scenarioId === scenario.id);
    const tries = mine.length;
    const best = Math.max(0, ...mine.map((attempt) => totalScore(attempt.grade)));
    const [lead, ...panel] = peopleIn(scenario, 'L1');
    const personaLine = `With ${scenario.persona.name}, ${scenario.persona.role.toLowerCase()}${
      panel.length ? `, and ${panel.map((person) => person.name).join(' and ')}` : ''
    }`;
    return (
      <Pressable
        key={scenario.id}
        accessibilityRole="button"
        accessibilityLabel={`${scenario.title}. ${personaLine}.${tries ? ` ${tries} attempts.` : ''}`}
        accessibilityHint="Opens the brief and difficulty choice"
        onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.cardHead}>
          <View style={styles.faces}>
            <Face face={lead.face} mood={lead.mood} size={48} />
            {panel.map((person) => (
              <View key={person.name} style={styles.panelFace}>
                <Face face={person.face} mood={person.mood} size={34} />
              </View>
            ))}
          </View>
          <View style={styles.cardTitle}>
            <Text style={type.heading}>{scenario.title}</Text>
            <Text style={type.caption}>{personaLine}</Text>
          </View>
        </View>
        <Text style={[type.body, styles.summary]} numberOfLines={3}>
          {scenario.summary}
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>L1 · L2 · L3</Text>
          </View>
          {tries > 0 ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {tries} {tries === 1 ? 'attempt' : 'attempts'}
              </Text>
            </View>
          ) : null}
          {tries > 0 ? (
            <View style={[styles.chip, styles.chipGood]}>
              <Text style={[styles.chipText, styles.chipGoodText]}>
                Best {best}/{MAX_TOTAL}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>HardTalk</Text>
        <Text style={styles.tagline} accessibilityRole="header">
          Practise the conversation before you have it.
        </Text>
        <Text style={styles.heroBody}>
          Say it out loud to someone who pushes back. Get a scorecard that quotes you. Try again.
        </Text>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>
            {pro ? 'Pro · unlimited practice' : `${freeLeft} of ${FREE_GRADED_SESSIONS} free graded sessions left`}
          </Text>
        </View>
      </View>
      <PurchaseNotice />
      <MockBanner />
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

      <View style={styles.actions}>
        <Button
          label={pro ? 'Create your own scenario' : 'Create your own scenario (Pro)'}
          variant="secondary"
          onPress={() => void openCustomScenario()}
          hint="Write a conversation with your real names and stakes"
        />
        {pro ? (
          <Button label="Your progress" variant="secondary" onPress={() => router.push('/history')} />
        ) : null}
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
            <Text style={[styles.linkText, confirmDelete && styles.danger]}>
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
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: space.lg, gap: space.sm, ...shadow },
  brand: { color: colors.onHeroMuted, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  tagline: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.onHero },
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
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  faces: { flexDirection: 'row', alignItems: 'flex-end' },
  panelFace: { marginLeft: -14 },
  cardTitle: { flex: 1, gap: 2 },
  summary: { color: colors.textMuted },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  chip: { backgroundColor: colors.quote, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  chipGood: { backgroundColor: '#E3F2EA' },
  chipGoodText: { color: colors.success },
  actions: { gap: space.sm, marginTop: space.sm },
  link: { minHeight: MIN_TARGET, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  danger: { color: colors.danger },
  disclaimer: { textAlign: 'center' },
});
