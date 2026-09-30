import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { restorePurchases } from '@/purchases';
import { paywallCopy } from '@/purchases/copy';
import { scenarioFromDraft } from '@/scenarios/draft';
import { sampleFor, sampleScenarioId } from '@/scenarios/drafting';
import { peopleIn } from '@/scenarios/people';
import { trackIdSchema } from '@/tracks/schema';
import { resolveMockPaywall } from '@/purchases/mock';
import type { PaywallOutcome, PaywallReason } from '@/purchases/types';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { Room } from '@/ui/Room';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

/**
 * Mock-mode stand-in for RevenueCat's paywall: the same copy and the same two entry points,
 * clearly labelled, with nothing charged. Live mode never routes here.
 */
export default function MockPaywall() {
  const params = useLocalSearchParams<{ reason: PaywallReason; scenarioTitle: string; scoreLine: string; track: string }>();
  const copy = paywallCopy({
    reason: params.reason === 'custom_scenario' ? 'custom_scenario' : 'session_limit',
    scenarioTitle: params.scenarioTitle || null,
    scoreLine: params.scoreLine || null,
  });
  const [plan, setPlan] = useState(copy.plans[0]?.id);
  const [restored, setRestored] = useState<string | null>(null);
  const sample = sampleFor(trackIdSchema.catch('interview').parse(params.track));
  const examplePeople = peopleIn(scenarioFromDraft(sample.draft, sample.track, 0, sampleScenarioId(sample.track)), 'L1');
  const chosen = copy.plans.find((option) => option.id === plan);
  const resolved = useRef(false);

  const close = (outcome: PaywallOutcome) => {
    resolved.current = true;
    resolveMockPaywall(outcome);
    router.back();
  };

  useEffect(
    () => () => {
      if (!resolved.current) resolveMockPaywall('cancelled');
    },
    [],
  );

  return (
    <Screen
      footer={
        <>
          <Button
            label={`Start Pro · ${chosen?.short ?? ''} (mock)`}
            onPress={() => close('purchased')}
          />
          <View style={styles.links}>
            <Pressable accessibilityRole="button" accessibilityLabel="Not now" onPress={() => close('cancelled')} style={styles.link}>
              <Text style={styles.linkText}>Not now</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              onPress={() => void restorePurchases().then(setRestored)}
              style={styles.link}>
              <Text style={styles.linkText}>Restore purchases</Text>
            </Pressable>
          </View>
          <Text style={[type.caption, styles.centred]}>Cancel any time in your App Store or Google Play settings.</Text>
          {restored ? (
            <Text style={type.caption} accessibilityLiveRegion="polite">
              {restored}
            </Text>
          ) : null}
        </>
      }>
      <View style={styles.notice} accessibilityRole="text">
        <Text style={styles.noticeText}>
          Mock paywall. The live app shows RevenueCat&apos;s paywall with this copy. Nothing is charged here.
        </Text>
      </View>
      <Text style={type.title} accessibilityRole="header">
        {copy.headline}
      </Text>
      <Text style={type.body}>{copy.body}</Text>
      {copy.score ? <Text style={styles.score}>{copy.score}</Text> : null}
      {params.reason === 'custom_scenario' ? (
        <View style={styles.example}>
          <Text style={styles.exampleLabel}>For example, from {sample.label.toLowerCase()}</Text>
          <Room people={examplePeople} size={44} uniform />
          {examplePeople.map((person) => (
            <Text key={person.name} style={type.caption}>
              {person.name} will ask about {person.asksAbout[0]?.toLowerCase()}
            </Text>
          ))}
        </View>
      ) : null}

      <ChoiceGroup
        label="Choose a plan"
        choices={copy.plans.map((option) => ({
          value: option.id,
          label: option.label,
          description: option.note ? `${option.price} · ${option.note}` : option.price,
        }))}
        selected={plan ?? ''}
        onSelect={setPlan}
      />

      <View style={styles.features}>
        {copy.features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Text style={styles.tick}>✓</Text>
            <Text style={[type.body, styles.featureText]}>{feature}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  example: { backgroundColor: colors.quote, borderRadius: radius, padding: space.md, gap: space.xs },
  exampleLabel: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  notice: { backgroundColor: colors.notice, borderRadius: radius, padding: space.sm + 4 },
  noticeText: { color: colors.onNotice, fontSize: 14, lineHeight: 19, fontWeight: '500' },
  score: { fontSize: 17, fontWeight: '700', color: colors.text },
  features: { gap: space.xs },
  feature: { flexDirection: 'row', gap: space.sm },
  tick: { fontSize: 17, fontWeight: '800', color: colors.success, lineHeight: 23 },
  featureText: { flex: 1 },
  links: { flexDirection: 'row', justifyContent: 'space-around' },
  centred: { textAlign: 'center' },
  link: { minHeight: MIN_TARGET, justifyContent: 'center', paddingHorizontal: space.sm },
  linkText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
