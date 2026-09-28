import type { Speaker } from '@/voice/VoiceProvider';

export interface Turn {
  speaker: Speaker;
  text: string;
}

export function userText(turns: Turn[]): string {
  return turns
    .filter((turn) => turn.speaker === 'user')
    .map((turn) => turn.text)
    .join('\n');
}
