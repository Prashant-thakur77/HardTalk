import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addAttempt, nextAttemptNumber } from '@/attempts/store';
import { gradeConversation } from '@/grading';
import type { Turn } from '@/grading/transcript';
import { getScenario } from '@/scenarios';
import { difficultySchema } from '@/scenarios/schema';
import { useConversation } from '@/session/useConversation';
import { Button } from '@/ui/Button';
import { MockBanner } from '@/ui/MockBanner';
import { colors, radius, space, type } from '@/ui/theme';
import type { EndReason, SessionState } from '@/voice';

function statusLabel(state: SessionState, personaName: string): string {
  switch (state.status) {
    case 'idle':
    case 'connecting':
      return 'Connecting…';
    case 'persona_speaking':
      return `${personaName} is speaking`;
    case 'listening':
      return 'Your turn';
    case 'ended':
      return 'Conversation over';
    case 'error':
      return 'Something went wrong';
  }
}

export default function Session() {
  const params = useLocalSearchParams<{ id: string; difficulty: string }>();
  const scenario = getScenario(params.id);
  const difficulty = difficultySchema.catch('L1').parse(params.difficulty);
  const [attempt] = useState(() => nextAttemptNumber(params.id));
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const ended = useRef<{ reason: EndReason; transcript: Turn[] } | null>(null);
  const scroll = useRef<ScrollView>(null);

  const score = () => {
    if (!ended.current || !scenario) return;
    const { reason, transcript } = ended.current;
    setGrading(true);
    setGradeError(null);
    gradeConversation({ scenarioId: scenario.id, attempt, turns: transcript })
      .then((grade) => {
        const id = `${scenario.id}-${attempt}-${Date.now()}`;
        addAttempt({
          id,
          scenarioId: scenario.id,
          difficulty,
          number: attempt,
          turns: transcript,
          grade,
          endReason: reason,
          createdAt: Date.now(),
        });
        router.replace({ pathname: '/scorecard/[attemptId]', params: { attemptId: id } });
      })
      .catch((error: unknown) => {
        setGrading(false);
        setGradeError(error instanceof Error ? error.message : String(error));
      });
  };

  const { turns, state, stop } = useConversation({
    scenarioId: params.id,
    difficulty,
    attempt,
    onEnd: (reason, transcript) => {
      if (reason === 'user_stopped') return;
      ended.current = { reason, transcript };
      score();
    },
  });

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const stoppedEarly = state.status === 'ended' && state.reason === 'user_stopped';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={type.heading}>
          {scenario.persona.name} · {difficulty}
        </Text>
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {grading ? 'Scoring your conversation…' : statusLabel(state, scenario.persona.name)}
        </Text>
        <MockBanner />
      </View>

      <ScrollView
        ref={scroll}
        style={styles.captions}
        contentContainerStyle={styles.captionsContent}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        accessibilityLabel="Live captions">
        {turns.map((turn) => {
          const persona = turn.speaker === 'persona';
          return (
            <View
              key={turn.id}
              style={[styles.bubble, persona ? styles.personaBubble : styles.userBubble]}
              accessible
              accessibilityLabel={`${persona ? scenario.persona.name : 'You'}: ${turn.text}`}>
              <Text style={[styles.speaker, !persona && styles.userText]}>
                {persona ? scenario.persona.name : 'You'}
              </Text>
              <Text style={[type.body, !persona && styles.userText]}>{turn.text}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {state.status === 'error' ? (
          <>
            <Text style={type.body} accessibilityLiveRegion="assertive">
              The conversation couldn’t continue: {state.message}
            </Text>
            <Button
              label="Try again"
              onPress={() =>
                router.replace({ pathname: '/session/[id]', params: { id: scenario.id, difficulty } })
              }
            />
            <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
          </>
        ) : gradeError ? (
          <>
            <Text style={type.body} accessibilityLiveRegion="assertive">
              Couldn’t score this conversation: {gradeError}
            </Text>
            <Button label="Try scoring again" onPress={score} />
            <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
          </>
        ) : stoppedEarly ? (
          <>
            <Text style={type.body}>You ended the conversation early, so it wasn’t scored.</Text>
            <Button
              label="Try again"
              onPress={() =>
                router.replace({ pathname: '/session/[id]', params: { id: scenario.id, difficulty } })
              }
            />
            <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
          </>
        ) : (
          <Button
            label="End conversation"
            variant="secondary"
            onPress={stop}
            disabled={state.status === 'ended'}
            hint="Stops the roleplay without scoring it"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: space.md, gap: space.sm },
  status: { fontSize: 16, fontWeight: '600', color: colors.primary },
  captions: { flex: 1 },
  captionsContent: { padding: space.md, gap: space.sm },
  bubble: { borderRadius: radius, padding: space.md - 4, maxWidth: '88%', gap: 2 },
  personaBubble: { alignSelf: 'flex-start', backgroundColor: colors.personaBubble },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.userBubble },
  speaker: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  userText: { color: colors.onPrimary },
  footer: {
    padding: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
