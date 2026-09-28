import type { Difficulty } from '../scenarios/schema';

export type Speaker = 'user' | 'persona';

/** A caption update. Partial updates for one utterance share an `id`; the last has `final: true`. */
export interface TranscriptEvent {
  id: string;
  speaker: Speaker;
  text: string;
  final: boolean;
}

export type EndReason = 'stop_condition' | 'turn_limit' | 'user_stopped';

export type SessionState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'listening' }
  | { status: 'persona_speaking' }
  | { status: 'ended'; reason: EndReason }
  | { status: 'error'; message: string };

export interface SessionConfig {
  scenarioId: string;
  difficulty: Difficulty;
  /** 1-based attempt number for this scenario. */
  attempt: number;
  /** Typed conversation: no microphone, no persona audio, same persona and grader. */
  textOnly: boolean;
  /** Persona speaking rate, 0.85 (slower) to 1.15 (faster). */
  speechRate: number;
  /** Show whole caption lines at once instead of word by word. */
  reduceMotion: boolean;
}

/**
 * The only thing screens know about voice. ElevenLabs, the mock, or any future provider
 * (OpenAI Realtime, Gemini Live) implements this and nothing else changes.
 */
export interface VoiceProvider {
  startSession(config: SessionConfig): Promise<void>;
  stopSession(): Promise<void>;
  onTranscript(listener: (event: TranscriptEvent) => void): () => void;
  onStateChange(listener: (state: SessionState) => void): () => void;
  /** Text-only mode: send the user's typed line. */
  sendText(text: string): void;
  /** Persona audio volume, 0 to 1. Lowered while a screen reader is speaking. */
  setVolume(volume: number): void;
  /** Mock replays only: the recorded user line due next, offered as a starting point. */
  suggestedReply?(): string | null;
}
