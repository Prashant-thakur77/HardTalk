import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { setSpeechRate, SPEECH_RATES, usePreferences } from '@/a11y/preferences';
import type { SessionMode } from '@/attempts/store';
import { config } from '@/config';
import { getScenario } from '@/scenarios';
import { hasRecording } from '@/mock/recordings';
import { isCustomScenario } from '@/scenarios/custom';
import { peopleIn } from '@/scenarios/people';
import { difficultySchema, type Difficulty } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { getTrack } from '@/tracks';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { RoomCard } from '@/ui/RoomCard';
import { Segmented } from '@/ui/Segmented';
import { Screen } from '@/ui/Screen';
import { colors, MIN_TARGET, space, type } from '@/ui/theme';

const MODES = [
  { value: 'voice', label: 'Talk', description: 'Speak out loud. Live captions for everyone.' },
  { value: 'text', label: 'Type', description: 'No microphone or audio. Same persona, same scorecard.' },
] as const;

export default function ScenarioBrief() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scenario = getScenario(id);
  const { speechRate, reduceMotion } = usePreferences();
  const [difficulty, setDifficulty] = useState<Difficulty>('L1');
  const [mode, setMode] = useState<SessionMode>('voice');
  // In an interview these facts are your own story, so they start open.
  const [showFacts, setShowFacts] = useState(() => getScenario(id)?.track === 'interview');

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const liveOnly = config.mock && isCustomScenario(scenario.id) && !hasRecording(scenario.id);
  const people = peopleIn(scenario, difficulty);
  const track = getTrack(scenario.track);

  return (
    <Screen
      footer={
        <>
          {liveOnly ? (
            <Text style={type.caption}>
              Your own scenarios run live, with your microphone. Mock mode replays only the built-in conversations and the drafted samples.
            </Text>
          ) : null}
          <Button
            label="Start conversation"
            onPress={() => void startSession(scenario.id, difficulty, mode, 'push')}
            hint="Starts the roleplay"
            disabled={liveOnly}
          />
        </>
      }>
      <Text style={styles.track}>{track.name}</Text>
      <Text style={type.title} accessibilityRole="header">
        {scenario.title}
      </Text>
      <Text style={type.body}>{scenario.summary}</Text>
      <View style={styles.goalCard}>
        <Text style={styles.label}>Your goal</Text>
        <Text style={styles.goalText}>{scenario.user_goal}</Text>
      </View>
      <View style={styles.facts}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showFacts }}
          accessibilityLabel={`What you both know, ${scenario.persona.context.length} facts`}
          onPress={() => setShowFacts((open) => !open)}
          style={styles.factsHead}>
          <Text style={styles.label}>What you both know</Text>
          <Text style={styles.chevron}>{showFacts ? '⌃' : `${scenario.persona.context.length} facts ⌄`}</Text>
        </Pressable>
        {showFacts
          ? scenario.persona.context.map((fact) => (
              <Text key={fact} style={type.body}>
                • {fact}
              </Text>
            ))
          : null}
      </View>
      <PurchaseNotice />

      <Segmented
        label={`How hard should ${scenario.persona.name} push back?`}
        segments={difficultySchema.options.map((option) => ({
          value: option,
          label: option,
          name: scenario.difficulty_levels[option].name,
          description: scenario.difficulty_levels[option].summary,
        }))}
        selected={difficulty}
        onSelect={setDifficulty}
      />
      <ChoiceGroup label="How do you want to practise?" choices={MODES} selected={mode} onSelect={setMode} horizontal />

      <RoomCard people={people} reduceMotion={reduceMotion} />
      {track.tip ? (
        <View style={styles.goal}>
          <Text style={styles.label}>Tip</Text>
          <Text style={type.body}>{track.tip}</Text>
        </View>
      ) : null}
      {mode === 'voice' ? (
        <ChoiceGroup
          label={people.length > 1 ? 'How fast they speak' : `${scenario.persona.name}'s speaking pace`}
          choices={SPEECH_RATES.map((rate) => ({ value: rate.value, label: rate.label }))}
          selected={speechRate}
          onSelect={(rate) => void setSpeechRate(rate)}
          horizontal
        />
      ) : null}
      <MockBanner
        compact
        message="Mock mode replays one recorded conversation at every level. Live mode uses your microphone, and the persona behaves as the level you pick."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  goal: { gap: 2 },
  goalCard: { gap: 2, backgroundColor: colors.quote, borderRadius: 14, padding: space.md },
  facts: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: space.md, gap: space.xs },
  factsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: MIN_TARGET },
  chevron: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  goalText: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
});
