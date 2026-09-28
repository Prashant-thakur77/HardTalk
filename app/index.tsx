import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAttempts } from '@/attempts/store';
import { scenarios } from '@/scenarios';
import { MockBanner } from '@/ui/MockBanner';
import { Screen } from '@/ui/Screen';
import { colors, radius, space, type } from '@/ui/theme';

export default function ScenarioList() {
  const attempts = useAttempts();

  return (
    <Screen>
      <Text style={styles.tagline} accessibilityRole="header">
        Practise the conversation before you have it.
      </Text>
      <MockBanner />
      {scenarios.map((scenario) => {
        const tries = attempts.filter((attempt) => attempt.scenarioId === scenario.id).length;
        const personaLine = `With ${scenario.persona.name}, ${scenario.persona.role.toLowerCase()}`;
        return (
          <Pressable
            key={scenario.id}
            accessibilityRole="button"
            accessibilityLabel={`${scenario.title}. ${personaLine}.`}
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
      })}
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
  tries: { alignSelf: 'flex-start', backgroundColor: colors.quote, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  triesText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
