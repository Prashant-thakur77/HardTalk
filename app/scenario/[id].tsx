import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getScenario } from '@/scenarios';
import { DIFFICULTIES } from '@/scenarios/difficulty';
import type { Difficulty } from '@/scenarios/schema';
import { Button } from '@/ui/Button';
import { MockBanner } from '@/ui/MockBanner';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';

export default function ScenarioBrief() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenario = getScenario(id);
  const [difficulty, setDifficulty] = useState<Difficulty>('L1');

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const start = () =>
    router.push({ pathname: '/session/[id]', params: { id: scenario.id, difficulty } });

  return (
    <Screen footer={<Button label="Start conversation" onPress={start} hint="Starts the roleplay" />}>
      <Text style={type.title} accessibilityRole="header">
        {scenario.title}
      </Text>
      <Text style={type.caption}>
        With {scenario.persona.name}, {scenario.persona.role.toLowerCase()}
      </Text>
      <Text style={type.body}>{scenario.summary}</Text>
      <MockBanner />

      <Text style={type.heading} accessibilityRole="header">
        How hard should {scenario.persona.name} push back?
      </Text>
      <View accessibilityRole="radiogroup" style={styles.levels}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => {
          const selected = level === difficulty;
          const { name, description } = DIFFICULTIES[level];
          return (
            <Pressable
              key={level}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${level}, ${name}. ${description}`}
              onPress={() => setDifficulty(level)}
              style={[styles.level, selected && styles.levelSelected]}>
              <Text style={[styles.levelName, selected && styles.levelNameSelected]}>
                {level} · {name}
              </Text>
              <Text style={type.caption}>{description}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levels: { gap: space.sm },
  level: {
    minHeight: MIN_TARGET,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    gap: space.xs,
  },
  levelSelected: { borderColor: colors.primary, backgroundColor: colors.quote },
  levelName: { fontSize: 17, fontWeight: '600', color: colors.text },
  levelNameSelected: { color: colors.primary },
});
