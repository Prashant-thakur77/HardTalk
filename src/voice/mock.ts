import { getRecording } from '@/mock/recordings';

import type { SessionConfig, SessionState, TranscriptEvent, VoiceProvider } from './VoiceProvider';

const WORD_MS = 90;
const TURN_GAP_MS = 700;
const CONNECT_MS = 600;

/**
 * Replays a recorded conversation with the same event shape a live provider emits:
 * word-by-word partial captions, speaker state changes, then `ended`.
 */
export class MockVoiceProvider implements VoiceProvider {
  private transcriptListeners = new Set<(event: TranscriptEvent) => void>();
  private stateListeners = new Set<(state: SessionState) => void>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ended = false;

  async startSession(config: SessionConfig): Promise<void> {
    const recording = getRecording(config.scenarioId, config.attempt);
    this.ended = false;
    this.emitState({ status: 'connecting' });

    let at = CONNECT_MS;
    recording.turns.forEach((turn, turnIndex) => {
      const id = `${config.attempt}-${turnIndex}`;
      const words = turn.text.split(' ');
      this.schedule(at, () =>
        this.emitState({ status: turn.speaker === 'persona' ? 'persona_speaking' : 'listening' }),
      );
      words.forEach((_, wordIndex) => {
        const final = wordIndex === words.length - 1;
        const text = words.slice(0, wordIndex + 1).join(' ');
        this.schedule(at + wordIndex * WORD_MS, () =>
          this.emitTranscript({ id, speaker: turn.speaker, text, final }),
        );
      });
      at += words.length * WORD_MS + TURN_GAP_MS;
    });

    this.schedule(at, () => this.finish({ status: 'ended', reason: recording.end_reason }));
  }

  async stopSession(): Promise<void> {
    this.finish({ status: 'ended', reason: 'user_stopped' });
  }

  onTranscript(listener: (event: TranscriptEvent) => void): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  onStateChange(listener: (state: SessionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private schedule(delayMs: number, run: () => void) {
    this.timers.push(setTimeout(run, delayMs));
  }

  private finish(state: SessionState) {
    if (this.ended) return;
    this.ended = true;
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
