import { useCallback, useEffect, useRef, useState } from 'react';

import type { Turn } from '@/grading/transcript';
import type { Difficulty } from '@/scenarios/schema';
import { createVoiceProvider, type EndReason, type SessionState, type VoiceProvider } from '@/voice';

import { applyTranscriptEvent, type LiveTurn } from './turns';

interface ConversationOptions {
  scenarioId: string;
  difficulty: Difficulty;
  attempt: number;
  /** Called once when the provider ends the session, with the final transcript. */
  onEnd: (reason: EndReason, turns: Turn[]) => void;
}

export function useConversation({ scenarioId, difficulty, attempt, onEnd }: ConversationOptions) {
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [state, setState] = useState<SessionState>({ status: 'idle' });
  const providerRef = useRef<VoiceProvider | null>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    const provider = createVoiceProvider();
    providerRef.current = provider;
    let latest: LiveTurn[] = [];

    const offTranscript = provider.onTranscript((event) => {
      latest = applyTranscriptEvent(latest, event);
      setTurns(latest);
    });
    const offState = provider.onStateChange((next) => {
      setState(next);
      if (next.status === 'ended') {
        onEndRef.current(next.reason, latest.map(({ speaker, text }) => ({ speaker, text })));
      }
    });
    provider
      .startSession({ scenarioId, difficulty, attempt })
      .catch((error: unknown) => setState({ status: 'error', message: String(error) }));

    return () => {
      offTranscript();
      offState();
      void provider.stopSession();
    };
  }, [scenarioId, difficulty, attempt]);

  const stop = useCallback(() => {
    void providerRef.current?.stopSession();
  }, []);

  return { turns, state, stop };
}
