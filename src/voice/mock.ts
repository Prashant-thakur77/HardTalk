import { getRecording, type Recording } from '@/mock/recordings';
import { getScenario } from '@/scenarios';
import { peopleIn } from '@/scenarios/people';

import type { Speaker } from './speech';
import type { SessionConfig, SessionState, TranscriptEvent, VoiceProvider } from './VoiceProvider';

const WORD_MS = 90;
/** Caption pace for a line read aloud, close to a speech engine's pace at rate 1. */
const SPOKEN_WORD_MS = 360;
const TURN_GAP_MS = 700;
const CONNECT_MS = 600;

/**
 * Replays a recorded conversation with the same event shape a live provider emits:
 * word-by-word partial captions, speaker state changes, then `ended`. With a speaker, each
 * persona's lines are read aloud in their own pitch and captioned at speaking pace. In
 * text-only mode nothing is heard, and the persona's lines wait for each typed reply.
 */
export class MockVoiceProvider implements VoiceProvider {
  constructor(private readonly speaker?: Speaker) {}

  private pitches = new Map<string, number>();
  private muted = false;

  private transcriptListeners = new Set<(event: TranscriptEvent) => void>();
  private stateListeners = new Set<(state: SessionState) => void>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ended = false;
  private recording: Recording | null = null;
  private config: SessionConfig | null = null;
  /** Text mode: index of the next recorded turn to play. */
  private cursor = 0;

  async startSession(config: SessionConfig): Promise<void> {
    this.recording = getRecording(config.scenarioId, config.attempt);
    this.config = config;
    const scenario = getScenario(config.scenarioId);
    this.pitches = new Map(
      scenario ? peopleIn(scenario, config.difficulty).map((person) => [person.name, person.pitch]) : [],
    );
    this.ended = false;
    this.cursor = 0;
    this.emitState({ status: 'connecting' });

    if (config.textOnly) {
      this.schedule(CONNECT_MS, () => this.playPersonaTurns(0));
      return;
    }
    const end = this.playTurns(this.recording.turns.map((turn, index) => ({ turn, index })), CONNECT_MS);
    this.schedule(end, () => this.finish({ status: 'ended', reason: this.recording!.end_reason }));
  }

  async stopSession(): Promise<void> {
    this.finish({ status: 'ended', reason: 'user_stopped' });
  }

  sendText(text: string): void {
    if (!this.recording || !this.config || this.ended) return;
    const recordedUserTurn = this.recording.turns.findIndex(
      (turn, index) => index >= this.cursor && turn.speaker === 'user',
    );
    this.emitTranscript({ id: `${this.config.attempt}-typed-${this.cursor}`, speaker: 'user', text, final: true });
    this.cursor = recordedUserTurn === -1 ? this.recording.turns.length : recordedUserTurn + 1;
    this.playPersonaTurns(0);
  }

  /** Screen reader announcements set this to 0 while they speak, so the two never overlap. */
  setVolume(volume: number): void {
    this.muted = volume === 0;
    if (this.muted) this.speaker?.stop();
  }

  suggestedReply(): string | null {
    return this.recording?.turns.slice(this.cursor).find((turn) => turn.speaker === 'user')?.text ?? null;
  }

  onTranscript(listener: (event: TranscriptEvent) => void): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  onStateChange(listener: (state: SessionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Text mode: play persona lines from the cursor until the next user turn, then wait. */
  private playPersonaTurns(delay: number) {
    const turns = this.recording!.turns;
    const batch: { turn: Recording['turns'][number]; index: number }[] = [];
    while (this.cursor < turns.length && turns[this.cursor]!.speaker === 'persona') {
      batch.push({ turn: turns[this.cursor]!, index: this.cursor });
      this.cursor += 1;
    }
    const end = this.playTurns(batch, delay);
    this.schedule(end, () =>
      this.cursor >= turns.length
        ? this.finish({ status: 'ended', reason: this.recording!.end_reason })
        : this.emitState({ status: 'listening' }),
    );
  }

  /** Schedules captions for the given turns starting at `start` ms; returns when they finish. */
  private playTurns(turns: { turn: Recording['turns'][number]; index: number }[], start: number): number {
    const { attempt, speechRate, reduceMotion, textOnly } = this.config!;
    const lead = getScenario(this.config!.scenarioId)?.persona.name;
    let at = start;
    for (const { turn, index } of turns) {
      const spoken = Boolean(this.speaker) && !textOnly && turn.speaker === 'persona';
      const wordMs = (spoken ? SPOKEN_WORD_MS : WORD_MS) / speechRate;
      const id = `${attempt}-${index}`;
      const who = turn.name ? { speaker: turn.speaker, name: turn.name } : { speaker: turn.speaker };
      const words = turn.text.split(' ');
      this.schedule(at, () =>
        this.emitState({ status: turn.speaker === 'persona' ? 'persona_speaking' : 'listening' }),
      );
      if (spoken) {
        const pitch = this.pitches.get(turn.name ?? lead ?? '') ?? 1;
        this.schedule(at, () => {
          if (!this.muted) this.speaker!.speak(turn.text, { pitch, rate: speechRate });
        });
      }
      if (reduceMotion) {
        this.schedule(at, () => this.emitTranscript({ id, ...who, text: turn.text, final: true }));
      } else {
        words.forEach((_, wordIndex) => {
          const final = wordIndex === words.length - 1;
          const text = words.slice(0, wordIndex + 1).join(' ');
          this.schedule(at + wordIndex * wordMs, () =>
            this.emitTranscript({ id, ...who, text, final }),
          );
        });
      }
      at += words.length * wordMs + TURN_GAP_MS;
    }
    return at;
  }

  private schedule(delayMs: number, run: () => void) {
    if (this.ended) return;
    this.timers.push(setTimeout(run, delayMs));
  }

  private finish(state: SessionState) {
    if (this.ended) return;
    this.ended = true;
    this.speaker?.stop();
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.emitState(state);
  }

  private emitTranscript(event: TranscriptEvent) {
    this.transcriptListeners.forEach((listener) => listener(event));
  }

  private emitState(state: SessionState) {
    this.stateListeners.forEach((listener) => listener(state));
  }
}
