import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { deleteAllAttempts, useAttempts } from '@/attempts/store';
import { restorePurchases, usePro } from '@/purchases';
import { safety } from '@/safety';
import { scenarios, useCustomScenarios } from '@/scenarios';
import type { Scenario } from '@/scenarios/schema';
import { openCustomScenario } from '@/session/start';
import { Button } from '@/ui/Button';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

export default function ScenarioList() {
  const attempts = useAttempts();
  const custom = useCustomScenarios();
  const pro = usePro();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const card = (scenario: Scenario) => {
    const tries = attempts.filter((attempt) => attempt.scenarioId === scenario.id).length;
    const personaLine = `With ${scenario.persona.name}, ${scenario.persona.role.toLowerCase()}`;
    return (
      <Pressable
        key={scenario.id}
        accessibilityRole="button"
        accessibilityLabel={`${scenario.title}. ${personaLine}.${tries ? ` ${tries} attempts.` : ''}`}
        accessibilityHint="Opens the brief and difficulty choice"
        onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <Text style={type.heading}>{scenario.title}</Text>
        <Text style={type.caption}>{personaLine}</Text>
        <Text style={type.body}>{scenario.summary}</Text>
        {tries > 0 ? (
          <View style={styles.tries}>
            <Text style={styles.triesText}>
              {tries} {tries === 1 ? 'attempt' : 'attempts'}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Screen>
      <Text style={styles.tagline} accessibilityRole="header">
        Practise the conversation before you have it.
      </Text>
      <PurchaseNotice />
      <MockBanner />
      {scenarios.map(card)}

      {custom.length > 0 ? (
        <Text style={type.heading} accessibilityRole="header">
          Your scenarios
        </Text>
      ) : null}
      {custom.map(card)}

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
  tagline: { ...type.title, fontSize: 24, lineHeight: 30 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  pressed: { opacity: 0.7 },
  tries: {
    alignSelf: 'flex-start',
    backgroundColor: colors.quote,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  triesText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  actions: { gap: space.sm, marginTop: space.sm },
  link: { minHeight: MIN_TARGET, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  danger: { color: colors.danger },
  disclaimer: { textAlign: 'center' },
});
