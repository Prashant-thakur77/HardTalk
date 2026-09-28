import { useCallback, useEffect, useRef, useState } from 'react';

import type { Turn } from '@/grading/transcript';
import type { Difficulty } from '@/scenarios/schema';
import { createVoiceProvider, type EndReason, type SessionState, type VoiceProvider } from '@/voice';

import { applyTranscriptEvent, type LiveTurn } from './turns';

interface ConversationOptions {
  scenarioId: string;
  difficulty: Difficulty;
  attempt: number;
  textOnly: boolean;
  speechRate: number;
  reduceMotion: boolean;
  /** Called once when the provider ends the session, with the final transcript. */
  onEnd: (reason: EndReason, turns: Turn[]) => void;
  /** Called for every finished user line, with a way to end the session there and then. */
  onUserLine?: (text: string, stop: () => void) => void;
  /** Called on every state change, with the most recent caption. */
  onStateChange?: (state: SessionState, lastTurn: LiveTurn | undefined) => void;
}

export function useConversation({
  scenarioId,
  difficulty,
  attempt,
  textOnly,
  speechRate,
  reduceMotion,
  onEnd,
  onUserLine,
  onStateChange,
}: ConversationOptions) {
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [state, setState] = useState<SessionState>({ status: 'idle' });
  const providerRef = useRef<VoiceProvider | null>(null);
  const onEndRef = useRef(onEnd);
  const onUserLineRef = useRef(onUserLine);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onEndRef.current = onEnd;
    onUserLineRef.current = onUserLine;
    onStateChangeRef.current = onStateChange;
  });

  useEffect(() => {
    const provider = createVoiceProvider();
    providerRef.current = provider;
    let latest: LiveTurn[] = [];

    const offTranscript = provider.onTranscript((event) => {
      latest = applyTranscriptEvent(latest, event);
      setTurns(latest);
      if (event.speaker === 'user' && event.final) {
        onUserLineRef.current?.(event.text, () => void provider.stopSession());
      }
    });
    const offState = provider.onStateChange((next) => {
      setState(next);
      onStateChangeRef.current?.(next, latest.at(-1));
      if (next.status === 'ended') {
        onEndRef.current(next.reason, latest.map(({ speaker, text }) => ({ speaker, text })));
      }
    });
    provider
      .startSession({ scenarioId, difficulty, attempt, textOnly, speechRate, reduceMotion })
      .catch((error: unknown) => setState({ status: 'error', message: String(error) }));

    return () => {
      offTranscript();
      offState();
      void provider.stopSession();
    };
  }, [scenarioId, difficulty, attempt, textOnly, speechRate, reduceMotion]);

  const stop = useCallback(() => {
    void providerRef.current?.stopSession();
  }, []);

  const sendText = useCallback((text: string) => providerRef.current?.sendText(text), []);
  const setVolume = useCallback((volume: number) => providerRef.current?.setVolume(volume), []);
  const suggestedReply = useCallback(() => providerRef.current?.suggestedReply?.() ?? null, []);

  return { turns, state, stop, sendText, setVolume, suggestedReply };
}
