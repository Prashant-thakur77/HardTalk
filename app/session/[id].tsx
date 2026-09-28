import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { announce, turnHaptic } from '@/a11y/announce';
import { getPreferences } from '@/a11y/preferences';
import { addAttempt, nextAttemptNumber, type SessionMode } from '@/attempts/store';
import { config } from '@/config';
import { gradeConversation } from '@/grading';
import type { Turn } from '@/grading/transcript';
import { isDistressLine, isStopLine, NotScoredForSafety } from '@/safety';
import { getScenario } from '@/scenarios';
import { difficultySchema } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { useConversation } from '@/session/useConversation';
import { Button } from '@/ui/Button';
import { MockBanner } from '@/ui/MockBanner';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';
import type { EndReason, SessionState } from '@/voice';

function statusLabel(state: SessionState, personaName: string, textOnly: boolean): string {
  switch (state.status) {
    case 'idle':
    case 'connecting':
      return 'Connecting…';
    case 'persona_speaking':
      return textOnly ? `${personaName} is replying` : `${personaName} is speaking`;
    case 'listening':
      if (config.mock && !textOnly) return 'Replaying your recorded line';
      return textOnly ? 'Your turn. Type your reply.' : 'Your turn';
    case 'ended':
      return 'Conversation over';
    case 'error':
      return 'Something went wrong';
  }
}

export default function Session() {
  const params = useLocalSearchParams<{ id: string; difficulty: string; mode: string }>();
  const scenario = getScenario(params.id);
  const difficulty = difficultySchema.catch('L1').parse(params.difficulty);
  const mode: SessionMode = params.mode === 'text' ? 'text' : 'voice';
  const textOnly = mode === 'text';
  const [attempt] = useState(() => nextAttemptNumber(params.id));
  const [preferences] = useState(getPreferences);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const ended = useRef<{ reason: Exclude<EndReason, 'user_stopped'>; transcript: Turn[] } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const personaName = scenario?.persona.name ?? 'The persona';

  const score = () => {
    if (!ended.current || !scenario) return;
    const { reason, transcript } = ended.current;
    setGrading(true);
    setGradeError(null);
    gradeConversation({ scenarioId: scenario.id, attempt, turns: transcript })
      .then(async (grade) => {
        const id = `${scenario.id}-${attempt}-${Date.now()}`;
        await addAttempt({
          id,
          scenarioId: scenario.id,
          difficulty,
          mode,
          number: attempt,
          turns: transcript,
          grade,
          endReason: reason,
          createdAt: Date.now(),
        });
        router.replace({ pathname: '/scorecard/[attemptId]', params: { attemptId: id } });
      })
      .catch((error: unknown) => {
        if (error instanceof NotScoredForSafety) {
          router.replace('/support');
          return;
        }
        setGrading(false);
        setGradeError(error instanceof Error ? error.message : String(error));
      });
  };

  const { turns, state, stop, sendText, setVolume, suggestedReply } = useConversation({
    scenarioId: params.id,
    difficulty,
    attempt,
    textOnly,
    speechRate: preferences.speechRate,
    reduceMotion: preferences.reduceMotion,
    onEnd: (reason, transcript) => {
      turnHaptic('ended');
      if (reason === 'user_stopped') return;
      ended.current = { reason, transcript };
      score();
    },
    onUserLine: (text, stopNow) => {
      if (isDistressLine(text)) {
        stopNow();
        router.replace('/support');
      } else if (isStopLine(text)) {
        stopNow();
      }
    },
    onStateChange: (next, lastTurn) => {
      if (next.status !== 'listening') return;
      turnHaptic('your_turn');
      // Offer the recorded line only into an empty box: never overwrite what the user typed.
      setDraft((current) => (current.trim() ? current : (suggestedReply() ?? '')));
      // In text mode nothing is heard, so the persona's line is read out; in voice mode the
      // persona has just finished speaking, so only the turn change is announced.
      const line = textOnly && lastTurn?.speaker === 'persona' ? `${personaName}: ${lastTurn.text}. ` : '';
      announce(`${line}Your turn.`, setVolume);
    },
  });

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const stoppedEarly = state.status === 'ended' && state.reason === 'user_stopped';
  const canSend = textOnly && state.status === 'listening' && draft.trim().length > 0;
  const send = () => {
    if (!canSend) return;
    sendText(draft.trim());
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={type.heading}>
          {scenario.persona.name} · {difficulty}
          {textOnly ? ' · typed' : ''}
        </Text>
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {grading ? 'Scoring your conversation…' : statusLabel(state, scenario.persona.name, textOnly)}
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
            <Button label="Try again" onPress={() => void startSession(scenario.id, difficulty, mode, 'replace')} />
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
            <Text style={type.body} accessibilityLiveRegion="polite">
              Stopped. Nothing from this conversation was scored.
            </Text>
            <Button label="Try again" onPress={() => void startSession(scenario.id, difficulty, mode, 'replace')} />
            <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
            <Button label="Talk to someone" variant="secondary" onPress={() => router.replace('/support')} hint="Free, confidential support lines" />
          </>
        ) : (
          <>
            {textOnly ? (
              <View style={styles.composer}>
                {config.mock ? (
                  <Text style={type.caption}>
                    Prefilled with the recorded line. Mock mode replays recorded replies and a recorded grade, so the
                    persona won’t react to changes and any line you change scores lower here: the grade keeps only
                    evidence you actually typed. Live mode answers and grades your own words. Type “stop” to end
                    without a score.
                  </Text>
                ) : null}
                <TextInput
                  accessibilityLabel="Your reply"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={state.status === 'listening' ? 'Type your reply' : 'Wait for your turn'}
                  placeholderTextColor={colors.textMuted}
                  editable={state.status === 'listening'}
                  multiline
                  style={styles.input}
                />
                <Button label="Send" onPress={send} disabled={!canSend} />
              </View>
            ) : null}
            <Button
              label="End conversation"
              variant="secondary"
              onPress={stop}
              disabled={state.status === 'ended'}
              hint="Stops the roleplay without scoring it"
            />
          </>
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
  composer: { gap: space.sm },
  input: {
    minHeight: MIN_TARGET * 1.5,
    maxHeight: 140,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    padding: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
