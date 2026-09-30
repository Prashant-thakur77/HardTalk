import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { setSpeechRate, SPEECH_RATES, usePreferences } from '@/a11y/preferences';
import type { SessionMode } from '@/attempts/store';
import { config } from '@/config';
import { getScenario } from '@/scenarios';
import { isCustomScenario } from '@/scenarios/custom';
import { peopleIn, STANCE_LABEL } from '@/scenarios/people';
import { difficultySchema, type Difficulty } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { getTrack } from '@/tracks';
import { Button } from '@/ui/Button';
import { ChoiceGroup } from '@/ui/ChoiceGroup';
import { Face } from '@/ui/Face';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { Segmented } from '@/ui/Segmented';
import { Screen } from '@/ui/Screen';
import { colors, shadow, space, type } from '@/ui/theme';

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

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const liveOnly = config.mock && isCustomScenario(scenario.id);
  const people = peopleIn(scenario, difficulty);
  const track = getTrack(scenario.track);

  return (
    <Screen
      footer={
        <>
          {liveOnly ? (
            <Text style={type.caption}>
              Your own scenarios run live, with your microphone. Mock mode replays only the built-in conversations.
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

      <View style={styles.room}>
        <Text style={styles.label} accessibilityRole="header">
          Who’s in the room, and what they’ll ask
        </Text>
        {people.map((person) => (
          <View key={person.name} style={styles.person}>
            <Face face={person.face} mood={person.mood} size={52} reduceMotion={reduceMotion} />
            <View style={styles.personText}>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={type.caption}>{person.role}</Text>
              <Text style={[styles.stance, person.stance === 'agrees' && styles.agrees]}>{STANCE_LABEL[person.stance]}</Text>
              {person.asksAbout.length > 0 ? (
                <View
                  style={styles.topics}
                  accessible
                  accessibilityLabel={`${person.name} will ask about: ${person.asksAbout.join(', ')}`}>
                  {person.asksAbout.map((topic) => (
                    <View key={topic} style={styles.topic}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
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
  room: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    ...shadow,
  },
  person: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  topic: { backgroundColor: colors.track, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  topicText: { fontSize: 13, fontWeight: '600', color: colors.text },
  personText: { flex: 1, gap: 1 },
  personName: { fontSize: 17, fontWeight: '700', color: colors.text },
  stance: { fontSize: 13, fontWeight: '700', color: colors.warning },
  agrees: { color: colors.success },
  goal: { gap: 2 },
  goalCard: { gap: 2, backgroundColor: colors.quote, borderRadius: 14, padding: space.md },
  goalText: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
});
