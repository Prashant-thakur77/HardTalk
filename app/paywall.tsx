import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { paywallCopy } from '@/purchases/copy';
import { resolveMockPaywall } from '@/purchases/mock';
import type { PaywallOutcome, PaywallReason } from '@/purchases/types';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { Screen } from '@/ui/Screen';
import { colors, radius, space, type } from '@/ui/theme';

/**
 * Mock-mode stand-in for RevenueCat's paywall: the same copy and the same two entry points,
 * clearly labelled, with nothing charged. Live mode never routes here.
 */
export default function MockPaywall() {
  const params = useLocalSearchParams<{ reason: PaywallReason; scenarioTitle: string; scoreLine: string }>();
  const copy = paywallCopy({
    reason: params.reason === 'custom_scenario' ? 'custom_scenario' : 'session_limit',
    scenarioTitle: params.scenarioTitle || null,
    scoreLine: params.scoreLine || null,
  });
  const [plan, setPlan] = useState(copy.plans[0]?.id);
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
          <Button label="Start Pro (mock purchase)" onPress={() => close('purchased')} />
          <Button label="Not now" variant="secondary" onPress={() => close('cancelled')} />
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

      <View style={styles.features}>
        {copy.features.map((feature) => (
          <Text key={feature} style={type.body}>
            ✓ {feature}
          </Text>
        ))}
      </View>

      <ChoiceGroup
        label="Choose a plan"
        choices={copy.plans.map((option) => ({
          value: option.id,
          label: option.label,
          description: option.note ? `${option.price} · ${option.note}` : option.price,
        }))}
        selected={plan ?? ''}
        onSelect={setPlan}
        horizontal
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.notice, borderRadius: radius, padding: space.sm + 4 },
  noticeText: { color: colors.onNotice, fontSize: 14, lineHeight: 19, fontWeight: '500' },
  score: { fontSize: 17, fontWeight: '700', color: colors.success },
  features: { gap: space.xs },
});
