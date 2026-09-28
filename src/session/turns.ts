import type { TranscriptEvent } from '@/voice/VoiceProvider';

export type LiveTurn = TranscriptEvent;

/** Applies a caption update: replaces the partial with the same id, or appends a new turn. */
export function applyTranscriptEvent(turns: LiveTurn[], event: TranscriptEvent): LiveTurn[] {
  const index = turns.findIndex((turn) => turn.id === event.id);
  if (index === -1) return [...turns, event];
  const next = turns.slice();
  next[index] = event;
  return next;
}
