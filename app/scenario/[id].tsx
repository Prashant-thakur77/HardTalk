import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { setSpeechRate, SPEECH_RATES, usePreferences } from '@/a11y/preferences';
import type { SessionMode } from '@/attempts/store';
import { config } from '@/config';
import { getScenario } from '@/scenarios';
import { isCustomScenario } from '@/scenarios/custom';
import { difficultySchema, type Difficulty } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Screen } from '@/ui/Screen';
import { colors, type } from '@/ui/theme';

const MODES = [
  { value: 'voice', label: 'Talk', description: 'Speak out loud. Live captions for both of you.' },
  { value: 'text', label: 'Type', description: 'No microphone or audio. Same persona, same scorecard.' },
] as const;

export default function ScenarioBrief() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenario = getScenario(id);
  const { speechRate } = usePreferences();
  const [difficulty, setDifficulty] = useState<Difficulty>('L1');
  const [mode, setMode] = useState<SessionMode>('voice');

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const liveOnly = config.mock && isCustomScenario(scenario.id);

  return (
    <Screen
      footer={
        <Button
          label="Start conversation"
          onPress={() => void startSession(scenario.id, difficulty, mode, 'push')}
          hint="Starts the roleplay"
          disabled={liveOnly}
        />
      }>
      <Text style={type.title} accessibilityRole="header">
        {scenario.title}
      </Text>
      <Text style={type.caption}>
        With {scenario.persona.name}, {scenario.persona.role.toLowerCase()}
      </Text>
      <Text style={type.body}>{scenario.summary}</Text>
      <View style={styles.goal}>
        <Text style={styles.goalLabel}>Your goal</Text>
        <Text style={type.body}>{scenario.user_goal}</Text>
      </View>
      <MockBanner message="Mock mode replays one recorded conversation at every level. Live mode uses your microphone, and the persona behaves as the level you pick." />
      <PurchaseNotice />
      {liveOnly ? (
        <Text style={type.body}>
          Your own scenarios run live, with your microphone and the persona. Mock mode only replays the three
          built-in conversations.
        </Text>
      ) : null}

      <ChoiceGroup
        label={`How hard should ${scenario.persona.name} push back?`}
        choices={difficultySchema.options.map((level) => ({
          value: level,
          label: `${level} · ${scenario.difficulty_levels[level].name}`,
          description: scenario.difficulty_levels[level].summary,
        }))}
        selected={difficulty}
        onSelect={setDifficulty}
      />
      <ChoiceGroup label="How do you want to practise?" choices={MODES} selected={mode} onSelect={setMode} horizontal />
      {mode === 'voice' ? (
        <ChoiceGroup
          label={`${scenario.persona.name}'s speaking pace`}
          choices={SPEECH_RATES.map((rate) => ({ value: rate.value, label: rate.label }))}
          selected={speechRate}
          onSelect={(rate) => void setSpeechRate(rate)}
          horizontal
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  goal: { gap: 2 },
  goalLabel: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
});
