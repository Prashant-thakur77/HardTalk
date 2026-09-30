import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { announce, turnHaptic } from '@/a11y/announce';
import { getPreferences } from '@/a11y/preferences';
import { addAttempt, nextAttemptNumber, withdrawAttempt, type SessionMode } from '@/attempts/store';
import { config } from '@/config';
import { gradeConversation } from '@/grading';
import type { Turn } from '@/grading/transcript';
import { checkDistressRemotely, isDistressLine, isStopLine, NotScoredForSafety } from '@/safety';
import { matchesRecording, plainLine } from '@/mock/recordings';
import { getScenario } from '@/scenarios';
import { peopleIn } from '@/scenarios/people';
import { difficultySchema } from '@/scenarios/schema';
import { startSession } from '@/session/start';
import { getTrack } from '@/tracks';
import { useConversation } from '@/session/useConversation';
import { Button } from '@/ui/Button';
import { Face } from '@/ui/Face';
import { MockBanner } from '@/ui/MockBanner';
import { PurchaseNotice } from '@/ui/PurchaseNotice';
import { SendIcon } from '@/ui/icons';
import { Room } from '@/ui/Room';
import { colors, MIN_TARGET, radius, space, type } from '@/ui/theme';
import { TurnBar } from '@/ui/TurnBar';
import type { EndReason, SessionState } from '@/voice';

/** iOS's standard navigation bar height: the keyboard offset under the stack header. */
const IOS_NAV_BAR = 44;
/** Line height of the reply box, which sizes it in whole lines. */
const LINE = 23;

const TYPED_MOCK_MESSAGE =
  'Mock mode, typed: the persona and the grade are recorded, so only the recorded lines (one tap away) are scored here; a conversation in your own words is not scored or counted. Live mode answers and grades your own words. Type “stop” to end without a score.';

/** `speakerName` is whoever in the room holds the floor: the lead persona or a panelist. */
function statusLabel(state: SessionState, speakerName: string, textOnly: boolean): string {
  switch (state.status) {
    case 'idle':
    case 'connecting':
      return 'Connecting…';
    case 'persona_speaking':
      return textOnly ? `${speakerName} is replying` : `${speakerName} is speaking`;
    case 'listening':
      if (config.mock && !textOnly) return 'Your turn: replaying your recorded line';
      return textOnly ? 'Your turn. Type your reply.' : 'Your turn. Speak now';
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [ungradable, setUngradable] = useState(false);
  const [draft, setDraft] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  // Mock mode: set the moment a typed line leaves the recording, so the user knows at once.
  const [offScript, setOffScript] = useState(false);
  const [inputHeight, setInputHeight] = useState(2 * LINE);
  const ended = useRef<{ reason: Exclude<EndReason, 'user_stopped'>; transcript: Turn[] } | null>(null);
  const scroll = useRef<ScrollView>(null);
  // Set when the server's distress check flags a line, possibly after the session has ended.
  const flagged = useRef(false);
  const savedId = useRef<string | null>(null);
  const [safetyOffline, setSafetyOffline] = useState(false);
  // A practice built as a topic (D-124): a flagged line asks whether it is about the user instead
  // of ending the practice. Scoring, or showing a score already in flight, waits for the answer.
  const [askingIfPersonal, setAskingIfPersonal] = useState(false);
  const asking = useRef(false);
  const topicConfirmed = useRef(false);
  const scoring = useRef(false);
  const stopForSupport = useRef<() => void>(() => undefined);
  const personaName = scenario?.persona.name ?? 'The persona';

  const score = () => {
    if (!ended.current || !scenario || asking.current || scoring.current) return;
    if (flagged.current) {
      router.replace('/support');
      return;
    }
    const { reason, transcript } = ended.current;
    scoring.current = true;
    setGrading(true);
    setGradeError(null);
    gradeConversation({ scenarioId: scenario.id, attempt, turns: transcript, topicConfirmed: topicConfirmed.current })
      .then(async (grade) => {
        if (flagged.current) throw new NotScoredForSafety();
        const id = `${scenario.id}-${attempt}-${Date.now()}`;
        savedId.current = id;
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
        if (!asking.current) showScorecard();
      })
      .catch((error: unknown) => {
        if (error instanceof NotScoredForSafety) {
          router.replace('/support');
          return;
        }
        scoring.current = false;
        setGrading(false);
        setGradeError(error instanceof Error ? error.message : String(error));
      });
  };

  const showScorecard = () => {
    if (savedId.current) router.replace({ pathname: '/scorecard/[attemptId]', params: { attemptId: savedId.current } });
  };

  const carryOn = () => {
    asking.current = false;
    topicConfirmed.current = true;
    setAskingIfPersonal(false);
    if (savedId.current) showScorecard();
    else score();
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
      // Mock mode can only grade the recorded lines: a typed conversation in your own words is
      // not given the recording's grade, and does not use a free session.
      if (config.mock && textOnly && !matchesRecording(scenario?.id ?? '', attempt, transcript)) {
        setUngradable(true);
        return;
      }
      ended.current = { reason, transcript };
      score();
    },
    onUserLine: (text, stopNow) => {
      stopForSupport.current = () => {
        flagged.current = true;
        stopNow();
        // A flag that lands after scoring withdraws the saved attempt and its free session.
        if (savedId.current) void withdrawAttempt(savedId.current);
        router.replace('/support');
      };
      const flag = () => {
        if (!scenario?.sensitive_topic) return stopForSupport.current();
        asking.current = true;
        setAskingIfPersonal(true);
        AccessibilityInfo.announceForAccessibility('That sounded like it might be about you. Is it?');
      };
      if (isDistressLine(text)) {
        flag();
      } else if (isStopLine(text, [personaName])) {
        stopNow();
      } else {
        // Live mode: the server double-checks every line with a model, in the background.
        void checkDistressRemotely(text).then(({ distress, checked }) => {
          if (!checked && !config.mock) setSafetyOffline(true);
          if (distress && !flagged.current) flag();
        });
      }
    },
    onStateChange: (next, lastTurn) => {
      if (next.status !== 'listening') return;
      turnHaptic('your_turn');
      // Mock mode offers the recorded line as a chip; it never types for the user.
      setSuggestion(suggestedReply());
      // In text mode nothing is heard, so the persona's line is read out; in voice mode the
      // persona has just finished speaking, so only the turn change is announced.
      const line =
        textOnly && lastTurn?.speaker === 'persona' ? `${lastTurn.name ?? personaName}: ${lastTurn.text}. ` : '';
      announce(`${line}Your turn.`, setVolume);
    },
  });

  if (!scenario) return <Text style={type.body}>Scenario not found.</Text>;

  const people = peopleIn(scenario, difficulty);
  const faces = new Map(people.map((person) => [person.name, person]));
  const lastPersonaTurn = turns.findLast((turn) => turn.speaker === 'persona');
  const speaker = lastPersonaTurn?.name ?? scenario.persona.name;
  const stoppedEarly = state.status === 'ended' && state.reason === 'user_stopped';
  const canSend = textOnly && state.status === 'listening' && draft.trim().length > 0;
  const send = () => {
    if (!canSend) return;
    if (config.mock && suggestion && plainLine(draft) !== plainLine(suggestion)) setOffScript(true);
    sendText(draft.trim());
    setDraft('');
    setInputHeight(2 * LINE);
  };

  const userTurns = turns.filter((turn) => turn.speaker === 'user' && turn.final).length;
  const turn = grading ? 'waiting' : state.status === 'listening' ? 'you' : state.status === 'persona_speaking' ? 'them' : 'waiting';
  const status = grading ? 'Scoring your conversation…' : statusLabel(state, speaker, textOnly);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: `${getTrack(scenario.track).name} · ${people.map((person) => person.name).join(', ')}` }} />
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + IOS_NAV_BAR}>
        <View style={styles.header}>
          <View style={styles.headRow}>
            <Room
              people={people}
              speaking={state.status === 'persona_speaking' ? speaker : null}
              size={40}
              showNames={false}
              reduceMotion={preferences.reduceMotion}
            />
            <View
              style={styles.dots}
              accessible
              accessibilityLabel={`You have spoken ${userTurns} of ${scenario.max_user_turns} turns`}>
              <Text style={styles.turnText}>
                Turn {Math.min(userTurns + 1, scenario.max_user_turns)} of {scenario.max_user_turns}
              </Text>
              {width >= 360
                ? Array.from({ length: scenario.max_user_turns }, (_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, index < userTurns && styles.dotDone, index === userTurns && styles.dotNow]}
                    />
                  ))
                : null}
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.chip}>
              {difficulty} · {scenario.difficulty_levels[difficulty].name}
            </Text>
            <MockBanner compact message={textOnly ? TYPED_MOCK_MESSAGE : undefined} />
          </View>
          <PurchaseNotice />
          {safetyOffline ? (
            <Text style={type.caption} accessibilityLiveRegion="polite">
              The extra safety check on the server is offline. The on-device checks are still on.
            </Text>
          ) : null}
        </View>

        <ScrollView
          ref={scroll}
          style={styles.captions}
          contentContainerStyle={styles.captionsContent}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          accessibilityLabel="Live captions">
          {turns.map((line) => {
            const persona = line.speaker === 'persona';
            const who = persona ? (line.name ?? scenario.persona.name) : 'You';
            const face = faces.get(who);
            return (
              <View key={line.id} style={[styles.line, !persona && styles.userLine]}>
                {persona && face ? <Face face={face.face} mood={face.mood} size={30} reduceMotion /> : null}
                <View
                  style={[styles.bubble, persona ? styles.personaBubble : styles.userBubble]}
                  accessible
                  accessibilityLabel={`${who}: ${line.text}`}>
                  <Text style={[styles.speaker, !persona && styles.userText]}>{who}</Text>
                  <Text style={[type.body, !persona && styles.userText]}>{line.text}</Text>
                </View>
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
          ) : askingIfPersonal ? (
            <>
              <Text style={type.body} accessibilityLiveRegion="assertive">
                That sounded like it might be about you, not the topic. Is it?
              </Text>
              <Button label="It’s about me, stop here" onPress={() => stopForSupport.current()} />
              <Button
                label="It’s the topic, carry on"
                variant="secondary"
                onPress={carryOn}
              />
            </>
          ) : ungradable ? (
            <>
              <Text style={type.body} accessibilityLiveRegion="polite">
                Mock mode can only grade the recorded lines, and you used your own words, so this wasn’t scored or
                counted. Live mode grades what you actually say.
              </Text>
              <Button label="Try again" onPress={() => void startSession(scenario.id, difficulty, mode, 'replace')} />
              <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
            </>
          ) : stoppedEarly ? (
            <>
              <Text style={type.body} accessibilityLiveRegion="polite">
                Stopped. Nothing from this conversation was scored.
              </Text>
              <Button label="Try again" onPress={() => void startSession(scenario.id, difficulty, mode, 'replace')} />
              <Button label="Back to conversations" variant="secondary" onPress={() => router.dismissTo('/')} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Talk to someone"
                accessibilityHint="Free, confidential support lines"
                onPress={() => router.replace({ pathname: '/support', params: { reason: 'chosen' } })}
                style={styles.end}>
                <Text style={styles.supportText}>Talk to someone</Text>
              </Pressable>
            </>
          ) : (
            <>
              {textOnly ? (
                <>
                  <Text style={styles.typedStatus} accessibilityLiveRegion="polite">
                    {status}
                  </Text>
                  {suggestion && !draft && state.status === 'listening' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Use the recorded line"
                      accessibilityHint={suggestion}
                      onPress={() => setDraft(suggestion)}
                      style={styles.suggestion}>
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        Use the recorded line: “{suggestion}”
                      </Text>
                    </Pressable>
                  ) : null}
                  {config.mock && offScript ? (
                    <View style={styles.offScript} accessibilityLiveRegion="polite">
                      <Text style={styles.offScriptText}>
                        That line isn’t the recorded one, so this mock run won’t be scored or counted.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Restart with the recorded lines"
                        onPress={() => void startSession(scenario.id, difficulty, mode, 'replace')}
                        hitSlop={8}>
                        <Text style={styles.restart}>Restart with the recorded lines</Text>
                      </Pressable>
                    </View>
                  ) : config.mock && userTurns === 0 ? (
                    <Text style={type.caption}>
                      In mock mode the replies follow the recording, and only the recorded lines are scored.
                    </Text>
                  ) : null}
                  <View style={styles.composer}>
                    <View style={styles.inputBox}>
                      <TextInput
                        accessibilityLabel="Your reply"
                        value={draft}
                        onChangeText={setDraft}
                        placeholder={state.status === 'listening' ? 'Type your reply' : 'Wait for your turn'}
                        placeholderTextColor={colors.textMuted}
                        editable={state.status === 'listening'}
                        multiline
                        onContentSizeChange={(event) => setInputHeight(event.nativeEvent.contentSize.height)}
                        style={[styles.input, { height: Math.min(4 * LINE, Math.max(2 * LINE, inputHeight)) }]}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send"
                      accessibilityState={{ disabled: !canSend }}
                      disabled={!canSend}
                      onPress={send}
                      style={({ pressed }) => [styles.send, (!canSend || pressed) && styles.sendDimmed]}>
                      <SendIcon color={colors.onPrimary} />
                    </Pressable>
                  </View>
                </>
              ) : (
                <TurnBar
                  turn={turn}
                  label={status}
                  speaker={faces.get(speaker)}
                  reduceMotion={preferences.reduceMotion}
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="End conversation"
                accessibilityHint="Stops the roleplay without scoring it"
                accessibilityState={{ disabled: state.status === 'ended' }}
                disabled={state.status === 'ended'}
                onPress={stop}
                style={styles.end}>
                <Text style={styles.endText}>End conversation</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  chip: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.quote,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: space.xs },
  turnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginRight: space.xs },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.track },
  dotDone: { backgroundColor: colors.primary },
  dotNow: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  captions: { flex: 1 },
  captionsContent: { padding: space.md, gap: space.sm },
  line: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, maxWidth: '92%' },
  userLine: { alignSelf: 'flex-end' },
  bubble: { borderRadius: radius, padding: space.md - 4, gap: 2, flexShrink: 1 },
  personaBubble: { backgroundColor: colors.personaBubble, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.userBubble, borderBottomRightRadius: 4 },
  speaker: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  userText: { color: colors.onPrimary },
  suggestion: {
    minHeight: MIN_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: 999,
    backgroundColor: colors.quote,
  },
  suggestionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  offScript: { gap: space.xs, backgroundColor: colors.notice, borderRadius: radius, padding: space.sm },
  offScriptText: { fontSize: 14, lineHeight: 19, color: colors.onNotice },
  restart: { fontSize: 14, fontWeight: '800', color: colors.primary },
  typedStatus: { fontSize: 15, fontWeight: '700', color: colors.primary },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  // The border and padding sit on the box, so the text area clips at whole lines: two when
  // empty, up to four as it grows. No line is ever shown cut in half.
  inputBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  input: {
    minHeight: 2 * LINE,
    maxHeight: 4 * LINE,
    padding: 0,
    fontSize: 16,
    lineHeight: LINE,
    color: colors.text,
  },
  send: {
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderRadius: MIN_TARGET / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDimmed: { opacity: 0.5 },
  end: { minHeight: MIN_TARGET, alignItems: 'center', justifyContent: 'center' },
  endText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  supportText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    gap: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
