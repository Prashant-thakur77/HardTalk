import { z } from 'zod';

export const turnSchema = z.strictObject({
  speaker: z.enum(['user', 'persona']),
  text: z.string().min(1),
});
export type Turn = z.infer<typeof turnSchema>;

export function userText(turns: Turn[]): string {
  return turns
    .filter((turn) => turn.speaker === 'user')
    .map((turn) => turn.text)
    .join('\n');
}

export function formatTranscript(turns: Turn[], personaName: string): string {
  return turns
    .map((turn) => (turn.speaker === 'user' ? `USER: ${turn.text}` : `${personaName.toUpperCase()} (persona): ${turn.text}`))
    .join('\n');
}
